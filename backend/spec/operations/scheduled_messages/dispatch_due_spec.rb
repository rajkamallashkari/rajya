require "rails_helper"

RSpec.describe ScheduledMessages::DispatchDue do
  it "dispatches due rows and leaves future ones" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    due = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Due", scheduled_at: 1.hour.from_now
    ).value
    due.update_columns(scheduled_at: 1.minute.ago)
    future = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value

    described_class.call
    expect(conversation.messages.pluck(:body)).to eq([ "Due" ])
    expect(ScheduledMessage.find_by(id: future.id)).to be_present
  end
end
