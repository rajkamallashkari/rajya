require "rails_helper"

RSpec.describe Search::InConversation do
  it "returns empty results for a short query" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    result = described_class.call(account: user.account, conversation: conversation, query: "x")

    expect(result.value.messages).to eq([])
  end
end
