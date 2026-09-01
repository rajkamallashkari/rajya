require "rails_helper"

RSpec.describe Conversations::CreateGroup do
  it "creates a group with the creator as owner and others as members" do
    creator = create(:user).account
    human = create(:account)
    bot = create(:bot).account
    conversation = described_class.call(
      creator: creator, kind: "group", account_ids: [ human.id, bot.id ], title: "Crew", description: "Hi"
    ).value.conversation
    roles = conversation.conversation_memberships.index_by(&:account_id)

    expect(roles.fetch(creator.id).role).to eq("owner")
    expect(roles.fetch(human.id).role).to eq("member")
    expect(roles.fetch(bot.id).role).to eq("member")
    expect(conversation).to have_attributes(title: "Crew", description: "Hi")
  end

  it "writes conversation_created as the last-activity system message" do
    creator = create(:user).account
    conversation = described_class.call(
      creator: creator, kind: "group", account_ids: [ create(:account).id ], title: "Crew", description: nil
    ).value.conversation
    system = conversation.messages.find_by!(kind: "system")

    expect(system.system_event).to eq("conversation_created")
    expect(conversation.last_message_id).to eq(system.id)
  end

  it "generates a fallback title when none is given (BR-55)" do
    creator = create(:user).account
    other = create(:account)
    title = described_class.call(creator: creator, kind: "group", account_ids: [ other.id ], title: nil,
                                 description: nil).value.conversation.title

    expect(title).to match(/\AGroup [0-9A-F]{6}\z/)
  end

  it "does not duplicate the creator when they are already in account_ids" do
    creator = create(:user).account
    other = create(:account)
    conversation = described_class.call(
      creator: creator, kind: "group", account_ids: [ creator.id, other.id ], title: "T", description: nil
    ).value.conversation

    expect(conversation.conversation_memberships.count).to eq(Settings.fetch(:min_members))
  end

  it "rejects too few members, a missing account, and a cap breach (BR-54)" do
    creator = create(:user).account
    expect(described_class.call(creator: creator, kind: "group", account_ids: [], title: "X",
                                description: nil).error_code).to eq(:validation_failed)
    missing = Account.maximum(:id).to_i + 1
    expect(described_class.call(creator: creator, kind: "group", account_ids: [ missing ], title: "X",
                                description: nil).error_code).to eq(:not_found)

    AppSetting.create!(key: "max_members", value: Settings.fetch(:min_members), category: "groups")
    other = create(:account)
    extra = create(:account)
    expect(described_class.call(creator: creator, kind: "group", account_ids: [ other.id, extra.id ], title: "X",
                                description: nil).error_code).to eq(:validation_failed)
  end

  it "still creates a group when a member is blocked (NR-1)" do
    creator = create(:user).account
    blocked = create(:account)
    create(:block, blocker_account: creator, blocked_account: blocked)
    conversation = described_class.call(
      creator: creator, kind: "group", account_ids: [ blocked.id ], title: "Crew", description: nil
    ).value.conversation

    expect(conversation.conversation_memberships.map(&:account_id)).to include(blocked.id)
  end
end
