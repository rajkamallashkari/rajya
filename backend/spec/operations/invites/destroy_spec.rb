require "rails_helper"

RSpec.describe Invites::Destroy do
  it "revokes an invite by deleting the row" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)

    expect(described_class.call(actor: owner.account, invite: invite)).to be_success
    expect(GroupInvite.find_by(id: invite.id)).to be_nil
  end

  it "forbids a member from revoking" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)

    expect(described_class.call(actor: member.account, invite: invite).error_code).to eq(:forbidden)
    expect(invite.reload).to be_persisted
  end
end
