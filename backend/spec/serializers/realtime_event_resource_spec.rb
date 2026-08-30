require "rails_helper"

RSpec.describe RealtimeEventResource do
  it "flattens type and data into one envelope" do
    json = described_class.new(
      { type: :message_created, data: { "message_id" => 1, conversation_id: 2 } }
    ).to_h

    expect(json).to eq(
      "type" => "message_created",
      "message_id" => 1,
      "conversation_id" => 2
    )
  end
end
