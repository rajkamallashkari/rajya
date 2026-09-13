require "rails_helper"

RSpec.describe SystemEvents::Write do
  def group_for(owner)
    create_talk(kind: "group", owner: owner, members: [ create(:account) ])
  end

  def event_payload(owner)
    {
      changes_text: "Send messages: Members → Admins",
      name: owner.display_name,
      role: "admin",
      title: "Crew"
    }
  end

  SystemEvents::EVENTS.each do |event|
    it "writes #{event} as a positioned last-activity message (NR-4)" do
      owner = create(:user).account
      conversation = group_for(owner)
      payload = event_payload(owner)
      message = described_class.call(conversation: conversation, event: event, actor: owner, payload: payload).value

      expect(message).to have_attributes(
        kind: "system", system_event: event,
        body: Catalog.t("system_events.#{event}", **payload)
      )
      expect(conversation.reload.last_message_id).to eq(message.id)
    end
  end

  it "rejects an unknown event and a missing conversation" do
    owner = create(:user).account
    conversation = group_for(owner)

    expect(described_class.call(conversation: conversation, event: "nope").error_code).to eq(:validation_failed)
    expect(described_class.call(conversation: nil, event: "member_left").error_code).to eq(:not_found)
  end

  it "writes without an actor account id" do
    owner = create(:user).account
    conversation = group_for(owner)
    message = described_class.call(conversation: conversation, event: "member_left", payload: { name: "Ada" }).value

    expect(message.metadata).not_to have_key("actor_account_id")
  end
end
