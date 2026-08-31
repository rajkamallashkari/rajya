require "rails_helper"

RSpec.describe Ai::Summarize do
  it "summarises recent messages" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    Messages::Send.call(conversation: conversation, sender: user.account, body: "Ship on Friday")
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Friday ship", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, conversation: conversation, mode: "recent")
    expect(result.value).to have_attributes(text: "Friday ship", mode: "recent")
  end

  it "rejects an unknown mode and an empty excerpt" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    expect(described_class.call(account: user.account, conversation: conversation, mode: "nope").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: user.account, conversation: conversation, mode: "unread").error_code)
      .to eq(:validation_failed)
  end

  it "summarises unread messages after the last-seen watermark" do
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    first = Messages::Send.call(conversation: conversation, sender: peer.account, body: "old").value
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    membership.update!(last_seen_position: first.position)
    Messages::Send.call(conversation: conversation, sender: peer.account, body: "new")
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Catch up", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, conversation: conversation, mode: "unread")
    expect(result.value).to have_attributes(text: "Catch up", mode: "unread")
  end

  it "treats a missing membership as unseen" do
    user = create(:user)
    conversation = create_direct_between(create(:user).account, create(:account))
    Messages::Send.call(conversation: conversation, sender: conversation.conversation_memberships.first.account, body: "Hi")
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Catch up", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, conversation: conversation, mode: "unread")
    expect(result.value.mode).to eq("unread")
  end

  it "defaults a blank mode to unread and returns an upstream failure" do
    user = create(:user)
    peer = create(:user)
    conversation = create_direct_between(user.account, peer.account)
    Messages::Send.call(conversation: conversation, sender: peer.account, body: "Ship")
    conversation.conversation_memberships.find_by!(account: user.account).update!(last_seen_position: 0)
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))

    expect(described_class.call(account: user.account, conversation: conversation, mode: nil).error_code)
      .to eq(:upstream_failed)
  end
end
