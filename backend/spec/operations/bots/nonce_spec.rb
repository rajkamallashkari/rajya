require "rails_helper"

RSpec.describe Bots::Nonce do
  it "derives a stable UUID from the synthetic bot_reply name (BR-76)" do
    first = described_class.uuid(triggered_by_message_id: 1, bot_id: 2)
    second = described_class.uuid(triggered_by_message_id: 1, bot_id: 2)
    other = described_class.uuid(triggered_by_message_id: 1, bot_id: 3)

    expect(first).to eq(second)
    expect(first).not_to eq(other)
    expect(first).to match(/\A[0-9a-f-]{36}\z/)
  end

  it "changes the nonce when regenerating an earlier reply" do
    original = described_class.uuid(triggered_by_message_id: 9, bot_id: 4)
    regen = described_class.uuid(triggered_by_message_id: 9, bot_id: 4, regenerate_of_message_id: 12)

    expect(regen).not_to eq(original)
  end

  it "builds a generation id from conversation, trigger, bot, and optional regen" do
    expect(described_class.generation_id(conversation_id: 1, triggered_by_message_id: 2, bot_id: 3))
      .to eq("1:2:3")
    expect(
      described_class.generation_id(
        conversation_id: 1, triggered_by_message_id: 2, bot_id: 3, regenerate_of_message_id: 9
      )
    ).to eq("1:2:3:9")
  end
end
