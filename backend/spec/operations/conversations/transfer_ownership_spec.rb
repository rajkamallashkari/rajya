require "rails_helper"

RSpec.describe Conversations::TransferOwnership do
  def crew
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    [ owner, member, conversation ]
  end

  it "makes the target owner and the actor admin" do
    owner, member, conversation = crew
    result = described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)

    expect(result).to be_success
    expect(conversation.conversation_memberships.find_by!(account: member.account).role).to eq("owner")
    expect(conversation.conversation_memberships.find_by!(account: owner.account).role).to eq("admin")
    expect(conversation.messages.where(system_event: "role_changed").count).to eq(2)
  end

  it "forbids transferring to self or a bot" do
    owner, _member, conversation = crew
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
    bot = create(:bot)
    create(:conversation_membership, conversation: conversation, account: bot.account)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: bot.account.id).error_code).to eq(:forbidden)
  end

  it "forbids a non-owner actor and a missing target" do
    owner, member, conversation = crew
    expect(described_class.call(actor: member.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: create(:account).id).error_code).to eq(:not_found)
  end

  it "returns not_found when transfer is allowed but the actor has no owner row" do
    _owner, member, conversation = crew
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(
      instance_double(ConversationPolicy, transfer_ownership?: true)
    )
    expect(described_class.call(actor: stranger, conversation: conversation,
                                account_id: member.account.id).error_code).to eq(:not_found)
  end
end
