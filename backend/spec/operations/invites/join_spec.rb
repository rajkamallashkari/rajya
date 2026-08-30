require "rails_helper"

RSpec.describe Invites::Join do
  def crew
    owner = create(:user)
    extra = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ extra.account ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)
    [ owner, extra, conversation, invite ]
  end

  it "joins immediately, writes member_joined, and increments uses" do
    owner, _extra, conversation, invite = crew
    joiner = create(:user)
    result = described_class.call(invite: invite, account: joiner.account)

    expect(result.value.status).to eq("joined")
    row = conversation.conversation_memberships.find_by!(account: joiner.account)
    expect(row).to have_attributes(role: "member", status: "active", invited_by_account_id: owner.account.id)
    expect(invite.reload.uses_count).to eq(1)
    expect(conversation.messages.where(system_event: "member_joined").last.body)
      .to eq(Catalog.t("system_events.member_joined", name: joiner.account.display_name))
  end

  it "returns already_member without incrementing uses" do
    _owner, extra, _conversation, invite = crew
    result = described_class.call(invite: invite, account: extra.account)

    expect(result.value.status).to eq("already_member")
    expect(invite.reload.uses_count).to eq(0)
  end

  it "rejoins a left member and keeps watermarks (SCHEMA §3.2, BR-50)" do
    owner, extra, conversation, invite = crew
    seen = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Before").value
    Receipts::Advance.call(account: extra.account, conversation: conversation, position: seen.position, kind: "viewed")
    Conversations::Leave.call(account: extra.account, conversation: conversation)
    described_class.call(invite: invite, account: extra.account)
    membership = conversation.conversation_memberships.find_by!(account: extra.account)

    expect(membership).to have_attributes(status: "active", last_seen_position: seen.position)
    expect(invite.reload.uses_count).to eq(1)
  end

  it "creates a pending join request when the invite requires approval" do
    owner, _extra, conversation, invite = crew
    invite.update!(requires_approval: true)
    joiner = create(:user)
    result = described_class.call(invite: invite, account: joiner.account)

    expect(result.value.status).to eq("pending_approval")
    expect(result.value.conversation).to be_nil
    expect(invite.reload.uses_count).to eq(0)
    expect(conversation.join_requests.find_by!(account: joiner.account)).to be_pending
  end

  it "resets a previously decided request to pending (BR-60)" do
    owner, _extra, conversation, invite = crew
    invite.update!(requires_approval: true)
    joiner = create(:user)
    create(:join_request, :rejected, conversation: conversation, account: joiner.account, group_invite: invite)
    described_class.call(invite: invite, account: joiner.account)

    expect(conversation.join_requests.find_by!(account: joiner.account)).to be_pending
  end

  it "rejects a second pending request and an unusable invite" do
    _owner, _extra, conversation, invite = crew
    invite.update!(requires_approval: true)
    joiner = create(:user)
    described_class.call(invite: invite, account: joiner.account)
    expect(described_class.call(invite: invite, account: joiner.account).error_code).to eq(:conflict)

    invite.update!(requires_approval: false, expires_at: 1.minute.ago)
    other = create(:user)
    expect(described_class.call(invite: invite, account: other.account).error_code).to eq(:conflict)

    invite.update!(requires_approval: true, expires_at: 1.minute.ago)
    expect(described_class.call(invite: invite, account: create(:user).account).error_code).to eq(:conflict)
  end

  it "forbids a bot and a direct conversation" do
    owner, extra, _conversation, invite = crew
    expect(described_class.call(invite: invite, account: create(:bot).account).error_code).to eq(:forbidden)
    direct = create_direct_between(owner.account, extra.account)
    stolen = create(:group_invite, conversation: direct, created_by_account: owner.account)
    expect(described_class.call(invite: stolen, account: create(:user).account).error_code).to eq(:not_found)
  end

  it "cancels a stale pending request when joining an open invite" do
    _owner, _extra, conversation, invite = crew
    joiner = create(:user)
    create(:join_request, conversation: conversation, account: joiner.account)
    described_class.call(invite: invite, account: joiner.account)

    expect(conversation.join_requests.where(account: joiner.account)).to be_empty
  end

  it "rejects joining past max_members" do
    _owner, _extra, _conversation, invite = crew
    stub_setting(:max_members, Settings.fetch(:min_members), category: "groups")
    expect(described_class.call(invite: invite, account: create(:user).account).error_code).to eq(:conflict)
  end

  it "resets an expired pending request when the invite still requires approval" do
    _owner, _extra, conversation, invite = crew
    invite.update!(requires_approval: true)
    joiner = create(:user)
    stale = create(:join_request, conversation: conversation, account: joiner.account, group_invite: invite)
    stale.update_columns(created_at: Time.current - Settings.fetch(:join_request_expiry).seconds - 1)
    result = described_class.call(invite: invite, account: joiner.account)

    expect(result.value.status).to eq("pending_approval")
    expect(conversation.join_requests.find_by!(account: joiner.account)).to be_pending
  end
end
