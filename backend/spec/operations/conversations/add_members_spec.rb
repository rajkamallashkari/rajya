require "rails_helper"

RSpec.describe Conversations::AddMembers do
  def crew
    owner = create(:user)
    extra = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ extra.account ])
    [ owner, extra, conversation ]
  end

  it "adds a new member as member and writes member_added" do
    owner, _extra, conversation = crew
    join = create(:account)
    result = described_class.call(actor: owner.account, conversation: conversation, account_ids: [ join.id ])
    row = conversation.conversation_memberships.find_by!(account: join)

    expect(result).to be_success
    expect(row).to have_attributes(role: "member", status: "active", invited_by_account_id: owner.account.id)
    expect(conversation.messages.where(system_event: "member_added").last.body)
      .to eq(Catalog.t("system_events.member_added", name: join.display_name))
  end

  it "rejoins a left row without resetting watermarks (SCHEMA §3.2, BR-50)" do
    owner, extra, conversation = crew
    seen = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Before").value
    Receipts::Advance.call(account: extra.account, conversation: conversation, position: seen.position, kind: "viewed")
    Conversations::Leave.call(account: extra.account, conversation: conversation)
    Messages::Send.call(conversation: conversation, sender: owner.account, body: "While away")
    described_class.call(actor: owner.account, conversation: conversation, account_ids: [ extra.account.id ])
    membership = conversation.conversation_memberships.find_by!(account: extra.account)

    expect(membership).to have_attributes(status: "active", last_read_position: seen.position,
                                          last_seen_position: seen.position, role: "member")
    expect(membership.unread_count).to be >= 1
  end

  it "forbids adding to a direct or as a plain member" do
    owner, extra, conversation = crew
    expect(described_class.call(actor: extra.account, conversation: conversation,
                                account_ids: [ create(:account).id ]).error_code).to eq(:forbidden)
    direct = create_direct_between(owner.account, extra.account)
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, add_members?: true))
    expect(described_class.call(actor: owner.account, conversation: direct,
                                account_ids: [ create(:account).id ]).error_code).to eq(:forbidden)
  end

  it "rejects empty ids, missing accounts, and active duplicates" do
    owner, extra, conversation = crew
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_ids: []).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_ids: [ Account.maximum(:id).to_i + 1 ]).error_code).to eq(:not_found)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_ids: [ extra.account.id ]).error_code).to eq(:conflict)
  end

  it "rejects adding past max_members when a cap is set" do
    owner, _extra, conversation = crew
    stub_setting(:max_members, Settings.fetch(:min_members), category: "groups")
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                account_ids: [ create(:account).id ]).error_code).to eq(:validation_failed)
  end
end
