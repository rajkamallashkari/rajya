require "rails_helper"

RSpec.describe ScheduledMessages::Create do
  def setup
    user = create(:user)
    [ user, create_direct_between(user.account, create(:account)) ]
  end

  def stage(conversation, sender, **attrs)
    described_class.call(
      conversation: conversation, sender: sender, body: "Later",
      scheduled_at: 1.hour.from_now, **attrs
    )
  end

  it "stages a future send without touching the live feed" do
    user, conversation = setup
    at = 1.hour.from_now
    result = described_class.call(conversation: conversation, sender: user.account, body: "Later", scheduled_at: at)

    expect(result).to be_success
    expect(result.value.scheduled_at).to be_within(1.second).of(at)
    expect(conversation.messages).to be_empty
  end

  it "returns the existing row for a repeated client_nonce" do
    user, conversation = setup
    nonce = SecureRandom.uuid
    first = described_class.call(
      conversation: conversation, sender: user.account, body: "Later",
      scheduled_at: 1.hour.from_now, client_nonce: nonce
    ).value
    second = described_class.call(
      conversation: conversation, sender: user.account, body: "Later",
      scheduled_at: 1.hour.from_now, client_nonce: nonce
    ).value

    expect(second.id).to eq(first.id)
  end

  it "rejects a blank body, a past time, a bad nonce, and a channel member" do
    user, conversation = setup
    member = create(:user)
    channel = create_talk(kind: "channel", owner: create(:user).account, members: [ member.account ])

    expect(described_class.call(conversation: conversation, sender: user.account, body: " ", scheduled_at: 1.hour.from_now)
           .error_code).to eq(:validation_failed)
    expect(described_class.call(conversation: conversation, sender: user.account, body: "X", scheduled_at: 1.hour.ago)
           .error_code).to eq(:validation_failed)
    expect(described_class.call(conversation: conversation, sender: user.account, body: "X",
                                scheduled_at: 1.hour.from_now, client_nonce: "bad").error_code).to eq(:validation_failed)
    expect(described_class.call(conversation: channel, sender: member.account, body: "X", scheduled_at: 1.hour.from_now)
           .error_code).to eq(:forbidden)
  end

  it "returns the winner when a concurrent insert claims the nonce" do
    user, conversation = setup
    nonce = SecureRandom.uuid
    existing = stage(conversation, user.account, client_nonce: nonce).value
    allow(ScheduledMessage).to receive_messages(find_by: nil, find_by!: existing)
    allow(ScheduledMessage).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique.new("idx"))

    expect(stage(conversation, user.account, client_nonce: nonce).value.id).to eq(existing.id)
  end

  it "rejects an overlong body and a failed persist" do
    user, conversation = setup
    overlong = "x" * (Settings.fetch(:max_message_length) + 1)
    expect(described_class.call(conversation: conversation, sender: user.account, body: overlong,
                                scheduled_at: 1.hour.from_now).error_code).to eq(:validation_failed)
    allow(ScheduledMessage).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(ScheduledMessage.new))
    expect(described_class.call(conversation: conversation, sender: user.account, body: "Later",
                                scheduled_at: 1.hour.from_now).error_code).to eq(:validation_failed)
  end

  it "stages a recurring rule with next_run_at" do
    user, conversation = setup
    result = described_class.call(
      conversation: conversation, sender: user.account, body: "Daily",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=DAILY"
    )

    expect(result.value.recurrence_rule).to eq("FREQ=DAILY")
    expect(result.value.next_run_at).to be_within(2.seconds).of(result.value.scheduled_at)
  end

  it "rejects an unsupported recurrence rule" do
    user, conversation = setup
    expect(described_class.call(
      conversation: conversation, sender: user.account, body: "Later",
      scheduled_at: 1.hour.from_now, recurrence_rule: "FREQ=HOURLY"
    ).error_code).to eq(:validation_failed)
  end

  it "rejects an unparsable scheduled_at" do
    user, conversation = setup
    expect(described_class.call(conversation: conversation, sender: user.account, body: "Later",
                                scheduled_at: "not-a-time").error_code).to eq(:validation_failed)
  end
end
