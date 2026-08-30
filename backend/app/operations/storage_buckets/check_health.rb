module StorageBuckets
  class CheckHealth < ApplicationOperation
    def call(bucket: nil)
      scope = bucket ? StorageBucket.where(id: bucket.id) : StorageBucket.where(status: %w[active failed])
      scope.find_each { |row| check(row) }
      success(true)
    end

    private

    def check(bucket)
      probe(bucket)
      recover(bucket)
      bucket.update_column(:last_health_check_at, Time.current)
    rescue StandardError
      bucket.update_columns(status: "failed", last_health_check_at: Time.current)
    end

    def probe(bucket)
      service = ActiveStorage::Blob.services.fetch(bucket.service_name.to_sym)
      case service
      when ActiveStorage::Service::DiskService then probe_disk(service)
      else probe_object_store(service)
      end
    end

    def probe_disk(service)
      dir = service.root
      FileUtils.mkdir_p(dir)
      probe = File.join(dir, ".health")
      File.write(probe, "ok")
      File.delete(probe)
    end

    def probe_object_store(service)
      service.exist?("healthcheck")
    end

    def recover(bucket)
      return unless bucket.status == "failed"

      bucket.update_column(:status, "active")
    end
  end
end
