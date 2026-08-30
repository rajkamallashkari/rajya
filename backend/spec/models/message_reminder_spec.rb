require "rails_helper"

RSpec.describe MessageReminder do
  it "is due when remind_at has passed and it is not completed" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    due = create(:message_reminder, account: user.account, message: message, remind_at: 1.hour.from_now)
    due.update_columns(remind_at: 1.minute.ago)
    future = create(:message_reminder, account: user.account,
                    message: create(:message, conversation: conversation, sender_account: user.account),
                    remind_at: 1.hour.from_now)

    expect(described_class.due).to contain_exactly(due)
    expect(future).not_to be_completed
  end

  it "reads timezone from the account preference" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    due = create(:message_reminder, account: user.account,
                 message: create(:message, conversation: conversation, sender_account: user.account),
                 remind_at: 1.hour.from_now)

    expect(due.timezone_name).to eq(Preference::DEFAULT_TIMEZONE)
    create(:preference, account: user.account, data: { "locale" => { "timezone" => "Asia/Kolkata" } })
    expect(due.reload.timezone_name).to eq("Asia/Kolkata")
  end

  it "rejects a past remind_at on create and an oversize note" do
    reminder = build(:message_reminder, remind_at: 1.hour.ago)
    expect(reminder).not_to be_valid
    expect(reminder.errors[:remind_at]).to include(Catalog.t("errors.models.message_reminder.not_future"))

    stub_setting(:reminder_note_max_length, 2)
    long = build(:message_reminder, note: "abc")
    expect(long).not_to be_valid
  end
end
