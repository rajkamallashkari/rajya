require "rails_helper"

RSpec.describe ReportPolicy do
  let(:user) { create(:user) }

  it "allows a human to submit a report and load reasons" do
    policy = described_class.new(user.account, Report)

    expect(policy).to be_create
    expect(policy).to be_reasons
  end

  it "denies a bot" do
    policy = described_class.new(create(:bot).account, Report)

    expect(policy).not_to be_create
    expect(policy).not_to be_reasons
  end

  it "scopes to the acting account's reports" do
    mine = create(:report, reporter_account: user.account)
    create(:report)

    expect(described_class::Scope.new(user.account, Report.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, Report.all).resolve).to be_empty
  end
end
