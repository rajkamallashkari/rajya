require "rails_helper"

RSpec.describe StorageBucket do
  it "reports remaining capacity for an upload" do
    bucket = build(:storage_bucket, used_bytes: 8, capacity_bytes: 10)

    expect(bucket.capacity_available_for?(2)).to be(true)
    expect(bucket.capacity_available_for?(3)).to be(false)
  end
end
