require "rails_helper"

RSpec.describe Conversations::Demote do
  def crew
    owner = create(:user)
    admin = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, admins: [ admin.account ],
                               members: [ create(:account) ])
    [ owner, admin, conversation ]
  end

  it "demotes an admin to member and writes role_changed" do
    owner, admin, conversation = crew
    result = described_class.call(actor: owner.account, conversation: conversation, account_id: admin.account.id)

    expect(result).to be_success
    expect(conversation.conversation_memberships.find_by!(account: admin.account).role).to eq("member")
    expect(conversation.messages.where(system_event: "role_changed")).to exist
  end

  it "is idempotent for a member" do
    owner, _admin, conversation = crew
    member = conversation.conversation_memberships.find_by!(role: "member")
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: member.account_id)).to be_success
  end

  it "forbids demoting the owner or acting as admin" do
    owner, admin, conversation = crew
    member = conversation.conversation_memberships.find_by!(role: "member")
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
    expect(described_class.call(actor: admin.account, conversation: conversation,
                                account_id: member.account_id).error_code).to eq(:forbidden)
  end

  it "returns not_found for a missing target" do
    owner, _admin, conversation = crew
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: create(:account).id).error_code).to eq(:not_found)
  end
end
