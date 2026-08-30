require "rails_helper"

RSpec.describe ScheduledMessages::DispatchDueJob do
  it "delegates to DispatchDue" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Due", scheduled_at: 1.hour.from_now
    ).value
    row.update_columns(scheduled_at: 1.minute.ago)

    described_class.perform_now
    expect(conversation.messages.pluck(:body)).to eq([ "Due" ])
  end
end
