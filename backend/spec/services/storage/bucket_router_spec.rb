require "rails_helper"

RSpec.describe Storage::BucketRouter do
  it "picks the lowest-priority active bucket with capacity (BR-91)" do
    create(:storage_bucket, service_name: "test_secondary", priority: 1)
    preferred = create(:storage_bucket, service_name: "test", priority: 0)

    expect(described_class.available_for(1)).to eq(preferred)
  end

  it "raises when no active bucket has capacity" do
    create(:storage_bucket, :full, service_name: "test")
    create(:storage_bucket, :failed, service_name: "test_secondary")

    expect { described_class.available_for(1) }.to raise_error(described_class::NoBucketAvailable)
  end

  it "increments used_bytes and marks the bucket full when capacity is reached" do
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0, capacity_bytes: 10)

    described_class.record_upload!(bucket.service_name, 10)
    expect(bucket.reload).to have_attributes(used_bytes: 10, status: "full")
  end

  it "decrements used_bytes, floors at zero, and reopens a full bucket" do
    bucket = create(:storage_bucket, :full, service_name: "test", used_bytes: 10, capacity_bytes: 10)

    described_class.record_deletion!(bucket.service_name, 20)
    expect(bucket.reload).to have_attributes(used_bytes: 0, status: "active")
  end
end
