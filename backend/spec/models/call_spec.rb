require "rails_helper"

RSpec.describe Call do
  it "is valid as a ringing audio call" do
    expect(build(:call)).to be_valid
  end

  it "rejects an unknown kind or status" do
    expect(build(:call, kind: "screen")).not_to be_valid
    expect(build(:call, status: "busy")).not_to be_valid
  end

  it "finds the live call for an account and ignores terminal rows" do
    account = create(:account)
    live = create(:call, :active)
    create(:call_participant, :joined, call: live, account: account)
    dead = create(:call, :ended)
    create(:call_participant, call: dead, account: account, status: "left")

    expect(described_class.current_for(account.id)).to eq(live)
    expect(described_class.live_for?(account.id)).to be(true)
    expect(described_class.live_for?(create(:account).id)).to be(false)
  end

  it "lists other participant account ids" do
    call = create(:call)
    left = create(:call_participant, call: call, account: create(:account))
    right = create(:call_participant, call: call, account: create(:account))

    expect(call.other_account_ids(left.account_id)).to eq([ right.account_id ])
    expect(call.includes_account?(left.account_id)).to be(true)
    expect(call.terminal?).to be(false)
  end
end
