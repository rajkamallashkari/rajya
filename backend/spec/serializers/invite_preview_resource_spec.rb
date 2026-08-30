require "rails_helper"

RSpec.describe InvitePreviewResource do
  it "serializes the public surface and omits message content (BR-59)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    conversation.update!(title: "Garden")
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)
    json = described_class.new(Invites::Preview.call(invite: invite).value).to_h

    expect(json).to include(
      "title" => "Garden", "member_count" => 2, "kind" => "group", "usable" => true,
      "requires_approval" => false, "already_member" => false, "pending_request" => false,
      "avatar_url" => nil, "conversation_id" => nil
    )
    expect(json.keys).not_to include("messages", "body", "last_message")
  end

  it "includes conversation_id for an authenticated viewer" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)
    json = described_class.new(Invites::Preview.call(invite: invite, viewer: owner.account).value).to_h

    expect(json.fetch("conversation_id")).to eq(conversation.id)
    expect(json.fetch("already_member")).to be(true)
  end
end
