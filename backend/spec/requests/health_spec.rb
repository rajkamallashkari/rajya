require "swagger_helper"

# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups; separate describes keep before hooks from colliding
RSpec.describe "Liveness", type: :request do
  path "/up" do
    get "Liveness" do
      tags "Operational"
      description "Process is running. No dependency checks (NR-10)."
      produces "text/html"
      response "200", "alive" do
        run_test!
      end
    end
  end
end

RSpec.describe "Readiness when dependencies are up", type: :request do
  path "/health" do
    get "Readiness" do
      tags "Operational"
      description "Postgres, Redis, Solid Queue heartbeat, and object storage (NR-10)."
      produces "application/json"
      response "200", "ready" do
        schema "$ref" => "#/components/schemas/Health"

        before do
          allow(Health::Checker).to receive(:call).and_return(
            Health::Checker::Report.new(
              ok: true,
              checks: {
                postgres: { status: "ok" },
                redis: { status: "ok" },
                solid_queue: { status: "ok" },
                r2: { status: "ok" }
              }
            )
          )
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("status")).to eq("ok")
          expect(body.fetch("checks").keys).to contain_exactly("postgres", "redis", "solid_queue", "r2")
        end
      end
    end
  end
end

RSpec.describe "Readiness when a dependency is down", type: :request do
  path "/health" do
    get "Readiness" do
      tags "Operational"
      produces "application/json"
      response "503", "a dependency is down" do
        schema "$ref" => "#/components/schemas/Health"

        before do
          allow(Health::Checker).to receive(:call).and_return(
            Health::Checker::Report.new(
              ok: false,
              checks: {
                postgres: { status: "ok" },
                redis: { status: "error", message: "down" },
                solid_queue: { status: "ok" },
                r2: { status: "ok" }
              }
            )
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("error")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
