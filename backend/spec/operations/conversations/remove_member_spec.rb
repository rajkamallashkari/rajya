require "rails_helper"

RSpec.describe Conversations::RemoveMember do
  def crew
    owner = create(:user)
    admin = create(:user)
    member = create(:user)
    conversation = create_talk(
      kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]
    )
    [ owner, admin, member, conversation ]
  end

  it "soft-removes a non-owner and writes member_removed (SCHEMA §3.2)" do
    owner, _admin, member, conversation = crew
    result = described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)
    row = conversation.conversation_memberships.find_by!(account: member.account)

    expect(result).to be_success
    expect(row.status).to eq("removed")
    expect(conversation.messages.where(system_event: "member_removed")).to exist
  end

  it "clears the removed account's folder entry and scheduled messages" do
    owner, _admin, member, conversation = crew
    folder = create(:conversation_folder, account: member.account)
    create(:conversation_folder_entry, folder: folder, conversation: conversation)
    ScheduledMessages::Create.call(
      conversation: conversation, sender: member.account, body: "Later", scheduled_at: 1.hour.from_now
    )
    described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)

    expect(ConversationFolderEntry.where(folder: folder)).not_to exist
    expect(ScheduledMessage.where(sender_account: member.account, conversation: conversation)).not_to exist
  end

  it "lets an admin remove another admin" do
    _owner, admin, member, conversation = crew
    expect(described_class.call(actor: admin.account, conversation: conversation,
                                account_id: member.account.id)).to be_success
  end

  it "forbids removing the owner (SCHEMA §3.1)" do
    owner, admin, _member, conversation = crew
    expect(described_class.call(actor: admin.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
  end

  it "refuses a remove that would drop below min_members (BR-53)" do
    owner, admin, member, conversation = crew
    described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: admin.account.id).error_code).to eq(:validation_failed)
  end

  it "rejects self-remove and a missing target" do
    owner, _admin, _member, conversation = crew
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: create(:account).id).error_code).to eq(:not_found)
  end

  it "forbids a member and a direct" do
    owner, _admin, member, conversation = crew
    expect(described_class.call(actor: member.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
    direct = create_direct_between(owner.account, member.account)
    allow(ConversationPolicy).to receive(:new).and_return(
      instance_double(ConversationPolicy, remove_member?: true)
    )
    expect(described_class.call(actor: owner.account, conversation: direct,
                                account_id: member.account.id).error_code).to eq(:forbidden)
  end
end
