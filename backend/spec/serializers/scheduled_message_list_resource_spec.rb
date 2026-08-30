require "rails_helper"

RSpec.describe ScheduledMessageListResource do
  it "wraps rows in scheduled_messages" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    json = described_class.new(ScheduledMessages::List.new(scheduled_messages: [ row ])).to_h

    expect(json.fetch("scheduled_messages").sole.fetch("id")).to eq(row.id)
  end
end
