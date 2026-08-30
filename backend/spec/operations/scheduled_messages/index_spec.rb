require "rails_helper"

RSpec.describe ScheduledMessages::Index do
  it "lists the actor's pending rows and omits due ones" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    pending = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Soon", scheduled_at: 1.hour.from_now
    ).value
    due = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Now", scheduled_at: 1.minute.from_now
    ).value
    due.update_columns(scheduled_at: 1.minute.ago)

    ids = described_class.call(account: user.account, scheduled_messages: ScheduledMessage.all)
                         .value.scheduled_messages.map(&:id)
    expect(ids).to eq([ pending.id ])
  end
end
