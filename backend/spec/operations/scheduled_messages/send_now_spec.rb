require "rails_helper"

RSpec.describe ScheduledMessages::SendNow do
  it "dispatches immediately for the owner and forbids another account" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Now", scheduled_at: 1.hour.from_now
    ).value
    other = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Nope", scheduled_at: 1.hour.from_now
    ).value

    expect(described_class.call(scheduled_message: row, actor: user.account).value.body).to eq("Now")
    expect(described_class.call(scheduled_message: other, actor: create(:user).account).error_code)
      .to eq(:forbidden)
  end
end
