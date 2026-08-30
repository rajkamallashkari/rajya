require "rails_helper"

RSpec.describe ScheduledMessageResource do
  it "serializes staging fields" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    json = described_class.new(row).to_h

    expect(json).to include("id" => row.id, "body" => "Later", "conversation_id" => conversation.id)
  end
end
