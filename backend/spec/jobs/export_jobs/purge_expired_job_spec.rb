require "rails_helper"

RSpec.describe ExportJobs::PurgeExpiredJob do
  it "delegates to PurgeExpired" do
    allow(ExportJobs::PurgeExpired).to receive(:call).and_return(Result.success(true))

    described_class.perform_now

    expect(ExportJobs::PurgeExpired).to have_received(:call)
  end
end
