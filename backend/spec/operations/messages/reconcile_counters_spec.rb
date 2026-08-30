require "rails_helper"

RSpec.describe Messages::ReconcileCounters do
  it "repairs drifted reaction_summary and attachment_count" do
    message = create(:message)
    create(:reaction, message: message, emoji: "👍")
    create(:attachment, message: message)
    message.update_columns(reaction_summary: {}, attachment_count: 0)

    described_class.call(message: message)
    message.reload

    expect(message.reaction_summary).to eq("👍" => 1)
    expect(message.attachment_count).to eq(1)
  end

  it "walks every message when no target is given" do
    create(:message, attachment_count: 9)
    described_class.call
    expect(Message.pluck(:attachment_count)).to all(eq(0))
  end
end
