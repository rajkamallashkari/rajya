require "rails_helper"

RSpec.describe Block do
  it "is valid when blocking a different account" do
    expect(build(:block)).to be_valid
  end

  it "is invalid when the blocker and blocked account are the same" do
    account = create(:account)
    block = build(:block, blocker_account: account, blocked_account: account)

    expect(block).not_to be_valid
    expect(block.errors[:blocked_account_id]).to include("can't be the same as the blocking account")
  end

  it "skips the self-block check when either account is missing" do
    block = described_class.new

    expect(block).not_to be_valid
    expect(block.errors[:blocked_account_id]).not_to include("can't be the same as the blocking account")
  end
end
