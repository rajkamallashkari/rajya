require "rails_helper"

RSpec.describe StorageBuckets::HealthJob do
  it "delegates to CheckHealth for one bucket and for every bucket" do
    allow(StorageBuckets::CheckHealth).to receive(:call).and_return(Result.success(true))
    bucket = create(:storage_bucket, service_name: "test")

    described_class.perform_now(bucket.id)
    described_class.perform_now

    expect(StorageBuckets::CheckHealth).to have_received(:call).with(bucket: bucket)
    expect(StorageBuckets::CheckHealth).to have_received(:call).with(bucket: nil)
  end
end
