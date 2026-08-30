require "rails_helper"

RSpec.describe Polls::Close do
  def poll_for(user)
    conversation = create_direct_between(user.account, create(:account))
    Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Done?", options: %w[Yes No] }
    ).value.poll
  end

  it "closes an open poll and rejects a second close" do
    user = create(:user)
    poll = poll_for(user)
    message = described_class.call(poll: poll, actor: user.account).value

    expect(poll.reload).to be_closed
    expect(message.revision).to be > 1
    expect(described_class.call(poll: poll, actor: user.account).error_code).to eq(:conflict)
  end

  it "forbids a member who did not create the poll" do
    user = create(:user)
    poll = poll_for(user)
    peer = poll.message.conversation.conversation_memberships.where.not(account: user.account).sole.account
    expect(described_class.call(poll: poll, actor: peer).error_code).to eq(:forbidden)
  end

  it "rejects closing a poll whose parent message was unsent" do
    user = create(:user)
    poll = poll_for(user)
    Messages::Unsend.call(message: poll.message, actor: user.account)
    expect(described_class.call(poll: poll.reload, actor: user.account).error_code).to eq(:not_found)
  end
end
