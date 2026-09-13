require "rails_helper"

RSpec.describe Conversations::Update do
  def permission_event(previous:, current:)
    actor = create(:user).account
    conversation = create_talk(kind: "group", owner: actor, members: [ create(:account) ])
    conversation.update!(member_permissions: previous)
    described_class.call(account: actor, conversation: conversation, member_permissions: current)
    [ actor, conversation.reload.messages.find_by!(system_event: "permissions_changed") ]
  end

  it "updates title and description on a group" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    result = described_class.call(account: owner.account, conversation: conversation, title: "New", description: "Bio")

    expect(result).to be_success
    expect(result.value.conversation.title).to eq("New")
    expect(result.value.conversation.description).to eq("Bio")
    events = conversation.messages.where(kind: "system").order(:position).pluck(:system_event)
    expect(events).to eq(%w[title_changed description_changed])
  end

  it "rejects a blank title, a direct conversation, and still allows clearing description" do
    owner = create(:user)
    group = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    group.update!(description: "keep")
    direct = create_direct_between(owner.account)

    expect(described_class.call(account: owner.account, conversation: group, title: "   ").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: owner.account, conversation: direct, title: "X").error_code)
      .to eq(:forbidden)
    described_class.call(account: owner.account, conversation: group, description: nil)
    expect(group.reload.description).to be_nil
  end

  it "updates title without touching description when description is omitted" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    conversation.update!(description: "keep")
    described_class.call(account: owner.account, conversation: conversation, title: "Only")

    expect(conversation.reload).to have_attributes(title: "Only", description: "keep")
  end

  it "does not write a system event when the title is unchanged" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    described_class.call(account: owner.account, conversation: conversation, title: conversation.title)

    expect(conversation.reload.messages.where(system_event: "title_changed")).not_to exist
  end

  it "writes permission, slow-mode, and forwarding system events (NR-34, NR-36, NR-37)" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    described_class.call(
      account: owner.account, conversation: conversation,
      member_permissions: { "send_messages" => "admin" }, slow_mode_seconds: 10, restrict_forwarding: true
    )
    conversation.reload

    expect(conversation).to have_attributes(
      member_permissions: { "send_messages" => "admin" }, slow_mode_seconds: 10, restrict_forwarding: true
    )
    expect(conversation.messages.where(kind: "system").order(:position).pluck(:system_event))
      .to eq(%w[permissions_changed slow_mode_changed forwarding_restricted])
  end

  it "names the actor and values in permission event text and payload" do
    actor, event = permission_event(previous: {}, current: { "send_messages" => "admin" })

    expect(event.body).to eq(
      "#{actor.display_name} changed group permissions: Send messages: Members → Admins"
    )
    expect(event.metadata).to include(
      "actor_account_id" => actor.id, "name" => actor.display_name,
      "changes" => [
        { "new_value" => "admin", "permission" => "send_messages", "previous_value" => "member" }
      ]
    )
  end

  it "describes multiple permission changes in registry order" do
    actor, event = permission_event(
      previous: { "send_media" => "owner", "send_messages" => "admin" },
      current: { "add_members" => "admin", "send_media" => "admin" }
    )

    expect(event.metadata.fetch("changes").pluck("permission")).to eq(
      %w[add_members send_media send_messages]
    )
    expect(event.body).to eq(
      "#{actor.display_name} changed group permissions: " \
      "Add members: Members → Admins; Send media: Owner → Admins; Send messages: Admins → Members"
    )
  end

  it "writes forwarding_unrestricted when the restriction is lifted" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    conversation.update!(restrict_forwarding: true)
    described_class.call(account: owner.account, conversation: conversation, restrict_forwarding: false)

    expect(conversation.reload.messages.where(system_event: "forwarding_unrestricted")).to exist
  end

  it "rejects an unknown permission key and a slow-mode interval that is not a preset" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])

    expect(described_class.call(account: owner.account, conversation: conversation,
                                member_permissions: { "remove_members" => "admin" }).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: owner.account, conversation: conversation, member_permissions: []).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: owner.account, conversation: conversation, slow_mode_seconds: 7).error_code)
      .to eq(:validation_failed)
  end

  it "omits permission overrides when the key is absent and accepts an empty document" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    conversation.update!(member_permissions: { "send_messages" => "admin" })
    described_class.call(account: owner.account, conversation: conversation, title: "Keep perms")
    expect(conversation.reload.member_permissions).to eq("send_messages" => "admin")

    described_class.call(account: owner.account, conversation: conversation, member_permissions: {})
    expect(conversation.reload.member_permissions).to eq({})
  end

  it "does not write an event for an explicit default permission" do
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])

    described_class.call(
      account: owner.account,
      conversation: conversation,
      member_permissions: { "send_messages" => "member" }
    )

    expect(conversation.reload.member_permissions).to eq("send_messages" => "member")
    expect(conversation.messages.where(system_event: "permissions_changed")).not_to exist
  end

  it "forbids a member and an admin whose edit_info is owner-only" do
    member = create(:user)
    admin = create(:user)
    conversation = create_talk(
      kind: "group", owner: create(:user).account, admins: [ admin.account ], members: [ member.account ]
    )
    conversation.update!(member_permissions: { "edit_info" => "owner" })

    expect(described_class.call(account: member.account, conversation: conversation, title: "Nope").error_code)
      .to eq(:forbidden)
    expect(described_class.call(account: admin.account, conversation: conversation, title: "Nope").error_code)
      .to eq(:forbidden)
  end
end
