require "rails_helper"

RSpec.describe ScheduledMessageResource do
  let(:user) { create(:user) }
  let(:conversation) { create_direct_between(user.account, create(:account)) }
  let(:row) do
    ScheduledMessages::Create.call(
      conversation:, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
  end

  it "serializes staging fields" do
    json = described_class.new(row).to_h

    expect(json).to include(
      "id" => row.id,
      "body" => "Later",
      "conversation_id" => conversation.id,
      "conversation" => include("id" => conversation.id, "kind" => "direct", "member_count" => 2),
      "recurrence_rule" => nil
    )
  end
end
