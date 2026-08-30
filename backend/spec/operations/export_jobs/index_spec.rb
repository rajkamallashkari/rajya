require "rails_helper"

RSpec.describe ExportJobs::Index do
  it "lists the account's jobs newest first" do
    user = create(:user)
    older = create(:export_job, account: user.account)
    newer = create(:export_job, account: user.account)
    result = described_class.call(account: user.account, jobs: ExportJob.where(account: user.account))

    expect(result.value.export_jobs).to eq([ newer, older ])
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, jobs: ExportJob.none).error_code).to eq(:forbidden)
  end
end
