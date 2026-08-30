require "rails_helper"

RSpec.describe MessageReminders::Update do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    [ user, row ]
  end

  def raising_time(error)
    object = Object.new
    object.define_singleton_method(:in_time_zone) { raise error }
    object
  end

  it "updates note and time for the owner" do
    user, row = setup
    at = 2.hours.from_now
    result = described_class.call(reminder: row, actor: user.account, remind_at: at.iso8601, note: "Go")

    expect(result.value.note).to eq("Go")
    expect(result.value.remind_at).to be_within(1.second).of(at)
  end

  it "parses remind_at in the account timezone" do
    user, row = setup
    create(:preference, account: user.account, data: { "locale" => { "timezone" => "Asia/Kolkata" } })
    result = described_class.call(
      reminder: row, actor: user.account.reload, remind_at: "2099-06-01 09:00:00"
    )

    expect(result.value.remind_at).to eq(ActiveSupport::TimeZone["Asia/Kolkata"].parse("2099-06-01 09:00:00"))
  end

  it "updates note or time independently and rejects an oversize note" do
    user, row = setup
    later = 3.hours.from_now

    expect(described_class.call(reminder: row, actor: user.account, note: "Solo").value.note).to eq("Solo")
    expect(described_class.call(reminder: row.reload, actor: user.account, remind_at: later).value.remind_at)
      .to be_within(1.second).of(later)
    expect(described_class.call(reminder: row.reload, actor: user.account, remind_at: later).value.note).to eq("Solo")
    stub_setting(:reminder_note_max_length, 1)
    expect(described_class.call(reminder: row.reload, actor: user.account, note: "ab").error_code)
      .to eq(:validation_failed)
  end

  it "forbids another account and rejects a blank time" do
    user, row = setup
    expect(described_class.call(reminder: row, actor: create(:user).account, note: "X").error_code).to eq(:forbidden)
    expect(described_class.call(reminder: row, actor: user.account, remind_at: "not-a-time").error_code)
      .to eq(:validation_failed)
  end

  it "treats TypeError and ArgumentError from in_time_zone as validation_failed" do
    user, row = setup
    expect(described_class.call(reminder: row, actor: user.account, remind_at: Object.new).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(reminder: row, actor: user.account, remind_at: raising_time(TypeError)).error_code)
      .to eq(:validation_failed)
    expect(described_class.call(reminder: row, actor: user.account, remind_at: raising_time(ArgumentError)).error_code)
      .to eq(:validation_failed)
  end
end
