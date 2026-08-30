require "rails_helper"

RSpec.describe Messages::ReconcileCountersJob do
  it "delegates to the operation for one message and for all messages" do
    message = create(:message, attachment_count: 4)
    described_class.perform_now(message.id)
    expect(message.reload.attachment_count).to eq(0)

    other = create(:message, attachment_count: 3)
    described_class.perform_now
    expect(other.reload.attachment_count).to eq(0)
  end
end
