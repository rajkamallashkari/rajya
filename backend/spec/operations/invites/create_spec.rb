require "rails_helper"

RSpec.describe Invites::Create do
  def crew
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    [ owner, member, conversation ]
  end

  it "creates an invite with default TTL and generated token" do
    owner, _member, conversation = crew
    result = described_class.call(actor: owner.account, conversation: conversation)

    expect(result).to be_success
    expect(result.value).to have_attributes(requires_approval: false, max_uses: nil, uses_count: 0)
    expect(result.value.token).to be_present
    expect(result.value.expires_at).to be_within(2.seconds)
      .of(Time.current + Settings.fetch(:invite_token_ttl).seconds)
  end

  it "accepts approval, max_uses, a custom TTL, and a never-expiring expiry of zero" do
    owner, _member, conversation = crew
    never = described_class.call(
      actor: owner.account, conversation: conversation, requires_approval: true,
      max_uses: 2, expires_in_seconds: 0
    )
    timed = described_class.call(actor: owner.account, conversation: conversation, expires_in_seconds: 60)

    expect(never.value).to have_attributes(requires_approval: true, max_uses: 2, expires_at: nil)
    expect(timed.value.expires_at).to be_within(2.seconds).of(Time.current + 60.seconds)
  end

  it "forbids a member or a direct conversation" do
    owner, member, conversation = crew
    expect(described_class.call(actor: member.account, conversation: conversation).error_code).to eq(:forbidden)
    direct = create_direct_between(owner.account, member.account)
    expect(described_class.call(actor: owner.account, conversation: direct).error_code).to eq(:forbidden)
  end

  it "rejects max_uses above the ceiling and a negative expiry" do
    owner, _member, conversation = crew
    stub_setting(:invite_max_uses_ceiling, 1, category: "groups")
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                max_uses: 2).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                expires_in_seconds: -1).error_code).to eq(:validation_failed)
    expect(described_class.call(actor: owner.account, conversation: conversation,
                                max_uses: -1).error_code).to eq(:validation_failed)
  end
end
