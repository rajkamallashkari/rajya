require "rails_helper"

RSpec.describe Conversations::ReconcileSidebarJob do
  it "delegates to the reconcile operation" do
    conversation = create(:conversation, last_activity_at: 1.year.ago)
    message = create(:message, conversation: conversation, created_at: Time.current)
    conversation.update_columns(last_message_id: nil)

    described_class.perform_now
    expect(conversation.reload.last_message_id).to eq(message.id)
  end
end
