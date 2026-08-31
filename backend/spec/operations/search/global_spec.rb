require "rails_helper"

RSpec.describe Search::Global do
  it "returns empty payloads below the minimum length and hits when long enough" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account, display_name: "Needle Peer"))
    create(:message, conversation: conversation, sender_account: user.account, body: "needle body")
    short = described_class.call(account: user.account, query: "n")
    long = described_class.call(account: user.account, query: "needle")

    expect(short.value.messages).to eq([])
    expect(long.value.messages.sole.snippet).to include("needle")
    expect(long.value.conversations.sole.title).to eq("Needle Peer")
  end
end
