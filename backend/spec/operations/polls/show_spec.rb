require "rails_helper"

RSpec.describe Polls::Show do
  it "returns a live poll and hides a tombstoned parent" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Show?", options: %w[Yes No] }
    ).value
    expect(described_class.call(poll: message.poll)).to be_success
    Messages::Unsend.call(message: message, actor: user.account)
    expect(described_class.call(poll: message.poll.reload).error_code).to eq(:not_found)
  end
end
