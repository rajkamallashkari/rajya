require "rails_helper"

RSpec.describe MessageReminders::DispatchDue do
  include ActiveSupport::Testing::TimeHelpers

  def kolkata_row
    user = create(:user)
    create(:preference, account: user.account, data: { "locale" => { "timezone" => "Asia/Kolkata" } })
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    travel_to Time.utc(2026, 1, 14, 12, 0, 0) do
      MessageReminders::Create.call(
        account: user.account.reload, message: message, remind_at: "2026-01-15 09:00:00"
      ).value
    end
  end

  it "dispatches due pending reminders" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    row = MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
    row.update_columns(remind_at: 1.minute.ago)

    described_class.call
    expect(row.reload).to be_completed
  end

  it "does not fire a Kolkata 09:00 reminder at 03:29 UTC" do
    row = kolkata_row
    travel_to Time.utc(2026, 1, 15, 3, 29, 0) { described_class.call }
    expect(row.reload).not_to be_completed
  end

  it "fires a Kolkata 09:00 reminder at 03:30 UTC (NR-24)" do
    row = kolkata_row
    allow(Push::DeliveryChannel).to receive(:deliver).and_return(true)
    travel_to Time.utc(2026, 1, 15, 3, 30, 1) do
      described_class.call
      expect(row.reload).to be_completed
    end
    expect(Push::DeliveryChannel).to have_received(:deliver)
  end
end
