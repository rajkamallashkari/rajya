require "rails_helper"

RSpec.describe JoinRequests::Approve do
  def pending_request
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, :approval, conversation: conversation, created_by_account: owner.account)
    joiner = create(:user)
    request = create(:join_request, conversation: conversation, account: joiner.account, group_invite: invite)
    [ owner, conversation, invite, joiner, request ]
  end

  it "adds the requester, spends the invite, and writes member_joined" do
    owner, conversation, invite, joiner, request = pending_request
    described_class.call(actor: owner.account, join_request: request)

    expect(request.reload).to be_approved
    expect(invite.reload.uses_count).to eq(1)
    expect(conversation.conversation_memberships.find_by!(account: joiner.account)).to be_active
    expect(conversation.messages.where(system_event: "member_joined").last.body)
      .to eq(Catalog.t("system_events.member_joined", name: joiner.account.display_name))
  end

  it "marks an already-active requester approved without redeeming again" do
    owner, _conversation, invite, joiner, request = pending_request
    Conversations::AddMembers.call(actor: owner.account, conversation: request.conversation,
                                    account_ids: [ joiner.account.id ])
    described_class.call(actor: owner.account, join_request: request)

    expect(request.reload).to be_approved
    expect(invite.reload.uses_count).to eq(0)
  end

  it "forbids a member and refuses a spent invite" do
    owner, conversation, invite, _joiner, request = pending_request
    member = conversation.conversation_memberships.find_by!(role: "member").account
    expect(described_class.call(actor: member, join_request: request).error_code).to eq(:forbidden)

    invite.update!(max_uses: 1, uses_count: 1)
    expect(described_class.call(actor: owner.account, join_request: request).error_code).to eq(:conflict)
    expect(request.reload).to be_pending
  end

  it "refuses an already resolved request" do
    owner, _conversation, _invite, _joiner, request = pending_request
    request.update!(status: "rejected")
    expect(described_class.call(actor: owner.account, join_request: request).error_code).to eq(:conflict)
  end

  it "refuses an expired pending request and a full group" do
    owner, conversation, _invite, _joiner, request = pending_request
    request.update_columns(created_at: Time.current - Settings.fetch(:join_request_expiry).seconds - 1)
    expect(described_class.call(actor: owner.account, join_request: request).error_code).to eq(:conflict)

    request.update_columns(created_at: Time.current)
    stub_setting(:max_members, Settings.fetch(:min_members), category: "groups")
    expect(described_class.call(actor: owner.account, join_request: request).error_code).to eq(:validation_failed)
    expect(conversation.conversation_memberships.where(account: request.account)).to be_empty
  end

  it "approves a request that has no invite and skips notify for a bot" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    bot = create(:bot)
    request = create(:join_request, conversation: conversation, account: bot.account)

    expect(described_class.call(actor: owner.account, join_request: request)).to be_success
    expect(request.reload).to be_approved
    expect(conversation.conversation_memberships.find_by!(account: bot.account)).to be_active
  end

  it "treats a leftover membership as inside the member cap" do
    owner, conversation, _invite, joiner, request = pending_request
    Conversations::AddMembers.call(actor: owner.account, conversation: conversation, account_ids: [ joiner.account.id ])
    Conversations::Leave.call(account: joiner.account, conversation: conversation)
    stub_setting(:max_members, Settings.fetch(:min_members), category: "groups")

    expect(described_class.call(actor: owner.account, join_request: request)).to be_success
    expect(request.reload).to be_approved
  end
end
