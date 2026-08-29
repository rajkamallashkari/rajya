require "rails_helper"

RSpec.describe Conversations::ReconcileSidebar do
  it "repairs drifted last_message_id and last_activity_at (F-4)" do
    conversation = create(:conversation, last_activity_at: 1.year.ago)
    message = create(:message, conversation: conversation, created_at: 1.hour.ago)
    conversation.update_columns(last_message_id: nil, last_activity_at: conversation.created_at)

    described_class.call
    conversation.reload

    expect(conversation.last_message_id).to eq(message.id)
    expect(conversation.last_activity_at).to be_within(1.second).of(message.created_at)
  end

  it "falls back to created_at when the conversation has no messages" do
    conversation = create(:conversation, last_activity_at: 1.year.ago)
    described_class.call

    expect(conversation.reload.last_message_id).to be_nil
    expect(conversation.last_activity_at).to be_within(1.second).of(conversation.created_at)
  end
end
