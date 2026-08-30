require "rails_helper"

RSpec.describe Report do
  it "is valid for a pending account report" do
    expect(build(:report)).to be_valid
  end

  it "rejects an unknown subject type or status" do
    expect(build(:report, subject_type: "file")).not_to be_valid
    expect(build(:report, status: "closed")).not_to be_valid
  end

  it "scopes pending rows and reports pending?" do
    open_row = create(:report)
    create(:report, :dismissed, reporter_account: create(:account))

    expect(described_class.pending).to contain_exactly(open_row)
    expect(open_row).to be_pending
    expect(build(:report, :dismissed)).not_to be_pending
  end
end
