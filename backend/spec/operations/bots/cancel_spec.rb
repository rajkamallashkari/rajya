require "rails_helper"

RSpec.describe Bots::Cancel do
  it "sets the unified cancel flag for a member (BR-79)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    result = described_class.call(account: user.account, conversation: conversation, generation_id: "1:2:3")

    expect(result).to be_success
    expect(result.value).to eq(generation_id: "1:2:3")
    expect(Ai::Cancellation.requested?("1:2:3")).to be(true)
  end

  it "rejects a stranger and a blank generation id" do
    user = create(:user)
    conversation = create_direct_between(create(:account), create(:account))

    expect(described_class.call(account: user.account, conversation: conversation, generation_id: "g").error_code)
      .to eq(:forbidden)
    member = create(:user)
    own = create_direct_between(member.account, create(:account))
    expect(described_class.call(account: member.account, conversation: own, generation_id: "").error_code)
      .to eq(:validation_failed)
  end
end
