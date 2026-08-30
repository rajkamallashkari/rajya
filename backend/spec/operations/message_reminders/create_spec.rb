require "rails_helper"

RSpec.describe MessageReminders::Create do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, message ]
  end

  def raising_time(error)
    object = Object.new
    object.define_singleton_method(:in_time_zone) { raise error }
    object
  end

  it "stores remind_at in the account timezone (NR-24)" do
    user, message = setup
    create(:preference, account: user.account, data: { "locale" => { "timezone" => "Asia/Kolkata" } })
    result = described_class.call(account: user.account.reload, message: message, remind_at: "2099-01-15 09:00:00")

    expect(result).to be_success
    zone = ActiveSupport::TimeZone["Asia/Kolkata"]
    expect(result.value.remind_at).to eq(zone.parse("2099-01-15 09:00:00"))
  end

  it "upserts the unique account+message pair and rejects a past time" do
    user, message = setup
    first = described_class.call(account: user.account, message: message, remind_at: 2.hours.from_now, note: "A")
    second = described_class.call(account: user.account, message: message, remind_at: 3.hours.from_now, note: "B")

    expect(first.value.id).to eq(second.value.id)
    expect(second.value.note).to eq("B")
    expect(described_class.call(account: user.account, message: message, remind_at: 1.hour.ago).error_code)
      .to eq(:validation_failed)
    stub_setting(:reminder_note_max_length, 1)
    expect(described_class.call(account: user.account, message: message, remind_at: 1.hour.from_now, note: "ab")
                          .error_code).to eq(:validation_failed)
  end

  it "returns not_found for a stranger" do
    _user, message = setup
    expect(described_class.call(account: create(:user).account, message: message, remind_at: 1.hour.from_now)
                          .error_code).to eq(:not_found)
  end

  it "rejects an unparseable remind_at string or object" do
    user, message = setup
    expect(described_class.call(account: user.account, message: message, remind_at: "not-a-time").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(account: user.account, message: message, remind_at: Object.new).error_code)
      .to eq(:validation_failed)
  end

  it "treats TypeError and ArgumentError from in_time_zone as validation_failed" do
    user, message = setup
    expect(described_class.call(account: user.account, message: message, remind_at: raising_time(TypeError))
                          .error_code).to eq(:validation_failed)
    expect(described_class.call(account: user.account, message: message, remind_at: raising_time(ArgumentError))
                          .error_code).to eq(:validation_failed)
  end
end
