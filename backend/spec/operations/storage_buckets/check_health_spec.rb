require "rails_helper"

RSpec.describe StorageBuckets::CheckHealth do
  it "keeps a reachable disk bucket active and records the check time" do
    bucket = create(:storage_bucket, service_name: "test", status: "active")

    described_class.call(bucket: bucket)

    expect(bucket.reload.status).to eq("active")
    expect(bucket.last_health_check_at).to be_present
  end

  it "recovers a failed bucket whose service is reachable" do
    bucket = create(:storage_bucket, service_name: "test", status: "failed")

    described_class.call(bucket: bucket)

    expect(bucket.reload.status).to eq("active")
  end

  it "marks a bucket failed when the service is missing" do
    bucket = create(:storage_bucket, service_name: "missing", status: "active")

    described_class.call(bucket: bucket)

    expect(bucket.reload.status).to eq("failed")
  end

  it "checks every active and failed bucket when none is given" do
    create(:storage_bucket, service_name: "test", status: "active")
    create(:storage_bucket, service_name: "test_secondary", status: "disabled")

    described_class.call

    expect(StorageBucket.find_by!(service_name: "test").last_health_check_at).to be_present
    expect(StorageBucket.find_by!(service_name: "test_secondary").last_health_check_at).to be_nil
  end

  it "probes a non-disk service via exist?" do
    bucket = create(:storage_bucket, service_name: "test")
    service = instance_double(ActiveStorage::Service, exist?: false)
    allow(ActiveStorage::Blob.services).to receive(:fetch).and_return(service)

    described_class.call(bucket: bucket)

    expect(service).to have_received(:exist?).with("healthcheck")
    expect(bucket.reload.status).to eq("active")
  end
end
