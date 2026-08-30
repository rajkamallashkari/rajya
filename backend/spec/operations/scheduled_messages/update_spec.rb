require "rails_helper"

RSpec.describe ScheduledMessages::Update do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    [ user, row ]
  end

  it "updates body and scheduled_at" do
    user, row = setup
    at = 2.hours.from_now
    result = described_class.call(scheduled_message: row, actor: user.account, body: "New", scheduled_at: at)

    expect(result.value).to have_attributes(body: "New")
    expect(result.value.scheduled_at).to be_within(1.second).of(at)
  end

  it "rejects a blank body, a past time, and another account" do
    user, row = setup
    expect(described_class.call(scheduled_message: row, actor: user.account, body: " ").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(scheduled_message: row, actor: user.account, scheduled_at: 1.hour.ago).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(scheduled_message: row, actor: create(:user).account, body: "X").error_code)
      .to eq(:forbidden)
  end

  it "rejects an overlong body, a failed save, and a sender who can no longer post" do
    user, row = setup
    overlong = "x" * (Settings.fetch(:max_message_length) + 1)
    expect(described_class.call(scheduled_message: row, actor: user.account, body: overlong).error_code)
      .to eq(:validation_failed)
    allow(row).to receive(:save!).and_raise(ActiveRecord::RecordInvalid.new(row))
    expect(described_class.call(scheduled_message: row, actor: user.account, body: "New").error_code)
      .to eq(:validation_failed)
    row.conversation.conversation_memberships.find_by!(account: user.account).update!(status: "left")
    expect(described_class.call(scheduled_message: row, actor: user.account, body: "New").error_code)
      .to eq(:forbidden)
  end

  it "parses an ISO-8601 scheduled_at string" do
    user, row = setup
    at = 3.hours.from_now
    result = described_class.call(scheduled_message: row, actor: user.account, scheduled_at: at.iso8601)
    expect(result.value.scheduled_at).to be_within(2.seconds).of(at)
  end

  it "rejects an unparsable scheduled_at string" do
    user, row = setup
    expect(described_class.call(scheduled_message: row, actor: user.account, scheduled_at: "not-a-time").error_code)
      .to eq(:validation_failed)
  end
end
