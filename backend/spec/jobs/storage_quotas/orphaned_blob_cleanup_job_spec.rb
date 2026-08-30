require "rails_helper"

RSpec.describe StorageQuotas::OrphanedBlobCleanupJob do
  it "delegates to PurgeOrphans" do
    allow(StorageQuotas::PurgeOrphans).to receive(:call).and_return(Result.success(0))

    described_class.perform_now

    expect(StorageQuotas::PurgeOrphans).to have_received(:call)
  end
end
