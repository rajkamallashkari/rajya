require "rails_helper"

RSpec.describe Invites::Preview do
  it "returns title, member count, and no membership for an anonymous viewer (BR-59)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)
    result = described_class.call(invite: invite)

    expect(result.value).to have_attributes(
      member_count: 2, already_member: false, pending_request: false, viewer: nil
    )
    expect(result.value.conversation.title).to eq(conversation.title)
  end

  it "flags an authenticated member and a pending approval request" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    invite = create(:group_invite, :approval, conversation: conversation, created_by_account: owner.account)
    outsider = create(:user)
    create(:join_request, conversation: conversation, account: outsider.account, group_invite: invite)

    expect(described_class.call(invite: invite, viewer: member.account).value.already_member).to be(true)
    expect(described_class.call(invite: invite, viewer: outsider.account).value.pending_request).to be(true)
  end
end
