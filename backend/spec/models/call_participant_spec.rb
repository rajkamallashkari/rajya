require "rails_helper"

RSpec.describe CallParticipant do
  it "is valid as a ringing participant" do
    expect(build(:call_participant)).to be_valid
  end

  it "rejects an unknown status" do
    expect(build(:call_participant, status: "yelling")).not_to be_valid
  end

  it "rejects a second live row for the same account (BR-63)" do
    account = create(:account)
    create(:call_participant, :joined, call: create(:call, :active), account: account)

    expect {
      create(:call_participant, call: create(:call), account: account, status: "ringing")
    }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "allows a busy row while the account is live elsewhere (BR-63)" do
    account = create(:account)
    create(:call_participant, :joined, call: create(:call, :active), account: account)

    expect {
      create(:call_participant, :busy, call: create(:call), account: account)
    }.not_to raise_error
  end
end
