require "rails_helper"

RSpec.describe Conversations::Promote do
  def crew
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    [ owner, member, conversation ]
  end

  it "promotes a member to admin and writes role_changed" do
    owner, member, conversation = crew
    result = described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)

    expect(result).to be_success
    expect(conversation.conversation_memberships.find_by!(account: member.account).role).to eq("admin")
    expect(conversation.messages.where(system_event: "role_changed").last.body)
      .to eq(Catalog.t("system_events.role_changed", name: member.account.display_name, role: Catalog.t("roles.admin")))
  end

  it "is idempotent for an existing admin" do
    owner, member, conversation = crew
    described_class.call(actor: owner.account, conversation: conversation, account_id: member.account.id)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: member.account.id)).to be_success
  end

  it "forbids promoting the owner or a bot" do
    owner, _member, conversation = crew
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: owner.account.id).error_code).to eq(:forbidden)
    bot = create(:bot)
    create(:conversation_membership, conversation: conversation, account: bot.account)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: bot.account.id).error_code).to eq(:forbidden)
  end

  it "forbids a member actor and a missing target" do
    owner, member, conversation = crew
    expect(described_class.call(actor: member.account, conversation: conversation,
                                account_id: member.account.id).error_code).to eq(:forbidden)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_id: create(:account).id).error_code).to eq(:not_found)
  end
end
