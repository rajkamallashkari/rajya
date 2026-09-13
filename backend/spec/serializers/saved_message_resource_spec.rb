require "rails_helper"

RSpec.describe SavedMessageResource do
  let(:user) { create(:user) }
  let(:peer) { create(:account, display_name: "Grace Hopper") }
  let(:conversation) { create_direct_between(user.account, peer) }
  let(:message) { Messages::Send.call(conversation:, sender: user.account, body: "Hi").value }
  let(:saved) { Messages::Save.call(message:, actor: user.account).value }

  it "embeds the saved message and its direct conversation title" do
    json = described_class.new(saved).to_h

    expect(json).to include(
      "conversation_title" => "Grace Hopper",
      "conversation" => include(
        "id" => conversation.id,
        "kind" => "direct",
        "member_count" => 2,
        "peer" => include("id" => peer.id)
      ),
      "message_id" => message.id,
      "message" => include("body" => "Hi")
    )
  end

  it "uses the explicit group title" do
    user = create(:user)
    conversation = create(:conversation, kind: "group", title: "Launch team")
    create(:conversation_membership, account: user.account, conversation: conversation)
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    saved = Messages::Save.call(message: message, actor: user.account).value

    expect(described_class.new(saved).to_h.fetch("conversation_title")).to eq("Launch team")
  end

  it "returns no title when a direct chat has no active peer" do
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    conversation.conversation_memberships.find_by!(account: peer).update!(status: "left")
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    saved = Messages::Save.call(message: message, actor: user.account).value

    expect(described_class.new(saved).to_h.fetch("conversation_title")).to be_nil
  end
end
