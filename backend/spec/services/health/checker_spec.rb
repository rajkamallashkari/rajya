require "rails_helper"

RSpec.describe Health::Checker do
  def stub_queue_heartbeat(exists:)
    relation = instance_double(ActiveRecord::Relation, exists?: exists)
    allow(SolidQueue::Process).to receive(:where).and_return(relation)
  end

  it "can query solid_queue_processes after rajya:ensure_solid_schemas" do
    expect(SolidQueue::Process.connection.data_source_exists?("solid_queue_processes")).to be(true)
  end

  it "reports ok when every dependency answers" do
    stub_queue_heartbeat(exists: true)

    report = described_class.call

    expect(report).to be_ok
    expect(report.checks.keys).to contain_exactly(:postgres, :redis, :solid_queue, :r2)
    expect(report.checks.values).to all(include(status: "ok"))
  end

  it "reports postgres errors" do
    allow(ActiveRecord::Base.connection).to receive(:select_value).and_raise(StandardError, "down")

    expect(described_class.call.checks[:postgres]).to include(status: "error", message: "down")
  end

  it "reports redis errors" do
    allow(Redis).to receive(:new).and_raise(StandardError, "no redis")

    expect(described_class.call.checks[:redis]).to include(status: "error", message: "no redis")
  end

  it "reports an unexpected redis reply" do
    client = instance_double(Redis, ping: "NOPE", close: true)
    allow(Redis).to receive(:new).and_return(client)

    expect(described_class.call.checks[:redis]).to include(status: "error")
  end

  it "reports a stale Solid Queue heartbeat" do
    stub_queue_heartbeat(exists: false)

    expect(described_class.call.checks[:solid_queue]).to include(status: "error")
  end

  it "reports Solid Queue query errors" do
    allow(SolidQueue::Process).to receive(:where).and_raise(StandardError, "queue down")

    expect(described_class.call.checks[:solid_queue]).to include(status: "error", message: "queue down")
  end

  it "probes a non-disk storage service" do
    service = instance_double(ActiveStorage::Service, exist?: true)
    allow(ActiveStorage::Blob).to receive(:service).and_return(service)

    expect(described_class.call.checks[:r2]).to include(status: "ok")
  end

  it "reports object-store probe errors" do
    service = instance_double(ActiveStorage::Service)
    allow(service).to receive(:exist?).and_raise(StandardError, "bucket missing")
    allow(ActiveStorage::Blob).to receive(:service).and_return(service)

    expect(described_class.call.checks[:r2]).to include(status: "error", message: "bucket missing")
  end

  it "reports a storage service that cannot be probed" do
    allow(ActiveStorage::Blob).to receive(:service).and_raise(StandardError, "no service")

    expect(described_class.call.checks[:r2]).to include(status: "error", message: "no service")
  end
end
