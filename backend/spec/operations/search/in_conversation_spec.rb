require "rails_helper"

RSpec.describe Search::InConversation do
  it "returns empty results for a short query" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    result = described_class.call(account: user.account, conversation: conversation, query: "x")

    expect(result.value.messages).to eq([])
  end

  it "runs filter-only search and rejects invalid filters" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    kept = create(:message, conversation: conversation, sender_account: user.account, kind: "voice", body: nil)
    allowed = described_class.call(
      account: user.account, conversation: conversation, query: "", filters: { kind: "voice" }
    )
    denied = described_class.call(
      account: user.account, conversation: conversation, query: "ab", filters: { kind: "nope" }
    )

    expect(allowed.value.messages.sole.message.id).to eq(kept.id)
    expect(denied).to be_failure
    expect(denied.error_code).to eq(:validation_failed)
  end
end
