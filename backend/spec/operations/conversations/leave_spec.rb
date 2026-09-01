require "rails_helper"

RSpec.describe Conversations::Leave do
  it "lets a member leave and writes member_left (SCHEMA §3.2, changes BR-49)" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    result = described_class.call(account: member.account, conversation: conversation)

    expect(result).to be_success
    expect(conversation.conversation_memberships.find_by!(account: member.account).status).to eq("left")
    expect(conversation.messages.where(system_event: "member_left")).to exist
  end

  it "clears the leaver's folder entry and scheduled messages (BR-61)" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    folder = create(:conversation_folder, account: member.account)
    create(:conversation_folder_entry, folder: folder, conversation: conversation)
    ScheduledMessages::Create.call(
      conversation: conversation, sender: member.account, body: "Later", scheduled_at: 1.hour.from_now
    )
    described_class.call(account: member.account, conversation: conversation)

    expect(ConversationFolderEntry.where(folder: folder)).not_to exist
    expect(ScheduledMessage.where(sender_account: member.account)).not_to exist
  end

  it "lets a last remaining owner leave without destroying the conversation (changes BR-52)" do
    sole = create(:user)
    conversation = create_talk(kind: "group", owner: sole.account)
    expect(described_class.call(account: sole.account, conversation: conversation)).to be_success
    expect(conversation.reload).to be_persisted
    expect(conversation.conversation_memberships.active).to be_empty
  end

  it "blocks a sole owner while others remain (BR-51)" do
    owner = create(:user)
    crowded = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    expect(described_class.call(account: owner.account, conversation: crowded).error_code).to eq(:forbidden)
  end

  it "blocks a sole admin while others remain (BR-51)" do
    admin = create(:user)
    member = create(:account)
    only_admin = create_talk(kind: "group", owner: admin.account, members: [ member ])
    only_admin.conversation_memberships.find_by!(account: admin.account).update!(role: "admin")
    expect(described_class.call(account: admin.account, conversation: only_admin).error_code).to eq(:forbidden)
  end

  it "lets an admin leave when another admin or owner remains" do
    owner = create(:user)
    admin = create(:user)
    conversation = create_talk(
      kind: "group", owner: owner.account, admins: [ admin.account ], members: [ create(:account) ]
    )
    expect(described_class.call(account: admin.account, conversation: conversation)).to be_success
  end

  it "lets an owner leave after transferring, with no auto-transfer (BR-51)" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    expect(described_class.call(account: owner.account, conversation: conversation).error_code).to eq(:forbidden)
    Conversations::TransferOwnership.call(
      actor: owner.account, conversation: conversation, account_id: member.account.id
    )
    expect(described_class.call(account: owner.account, conversation: conversation)).to be_success
    expect(conversation.conversation_memberships.find_by!(account: member.account).role).to eq("owner")
  end

  it "forbids leaving a direct" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    expect(described_class.call(account: user.account, conversation: conversation).error_code).to eq(:forbidden)
  end

  it "returns not_found when leave is allowed but membership is missing" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, leave?: true))
    expect(described_class.call(account: user.account, conversation: conversation).error_code).to eq(:not_found)
  end

  it "returns not_found when leave is allowed but the membership is already inactive" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    conversation.conversation_memberships.find_by!(account: member.account).update!(status: "left")
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, leave?: true))
    expect(described_class.call(account: member.account, conversation: conversation).error_code).to eq(:not_found)
  end
end
