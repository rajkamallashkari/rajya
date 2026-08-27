# Readiness checks (TARGET_ARCHITECTURE.md §4.9 / NR-10). Postgres, Redis,
# Solid Queue heartbeat, and object-storage reachability — never mixed into
# the liveness probe at GET /up.
module Health
  class Checker
    STALE_AFTER = 120
    Report = Struct.new(:ok, :checks, keyword_init: true) do
      def ok?
        ok
      end
    end

    def self.call
      new.call
    end

    def call
      checks = {
        postgres: check_postgres,
        redis: check_redis,
        solid_queue: check_solid_queue,
        r2: check_r2
      }
      Report.new(ok: checks.values.all? { |check| check[:status] == "ok" }, checks: checks)
    end

    private

    def check_postgres
      ActiveRecord::Base.connection.select_value("SELECT 1")
      { status: "ok" }
    rescue StandardError => error
      { status: "error", message: error.message }
    end

    def check_redis
      client = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      pong = client.ping
      client.close
      return { status: "ok" } if pong == "PONG"

      { status: "error", message: Catalog.t("health.redis_unexpected") }
    rescue StandardError => error
      { status: "error", message: error.message }
    end

    def check_solid_queue
      cutoff = STALE_AFTER.seconds.ago
      return { status: "ok" } if SolidQueue::Process.where("last_heartbeat_at >= ?", cutoff).exists?

      { status: "error", message: Catalog.t("health.solid_queue_stale") }
    rescue StandardError => error
      { status: "error", message: error.message }
    end

    def check_r2
      service = ActiveStorage::Blob.service
      case service
      when ActiveStorage::Service::DiskService
        probe_disk(service)
      else
        probe_object_store(service)
      end
    rescue StandardError => error
      { status: "error", message: error.message }
    end

    def probe_disk(service)
      dir = service.root
      FileUtils.mkdir_p(dir)
      probe = File.join(dir, ".health")
      File.write(probe, "ok")
      File.delete(probe)
      { status: "ok" }
    end

    def probe_object_store(service)
      service.exist?("healthcheck")
      { status: "ok" }
    rescue StandardError => error
      { status: "error", message: error.message }
    end
  end
end
