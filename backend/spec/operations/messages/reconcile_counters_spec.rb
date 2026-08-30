require "rails_helper"

RSpec.describe Messages::ReconcileCounters do
  def drifted_message
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Fix?", options: %w[Yes No] },
      attachment_signed_ids: [ blob_signed_id ]
    ).value
    create(:reaction, message: message, emoji: "👍", account: user.account)
    Polls::Vote.call(poll: message.poll, actor: user.account, option_ids: [ message.poll.poll_options.first.id ])
    message.update_columns(reaction_summary: {}, attachment_count: 0)
    message.poll.update_columns(voter_count: 0)
    message
  end

  it "repairs drifted reaction_summary, attachment_count, and poll counts" do
    message = drifted_message
    described_class.call(message: message)
    message.reload

    expect(message.reaction_summary).to eq("👍" => 1)
    expect(message.attachment_count).to eq(1)
    expect(message.poll.reload.voter_count).to eq(1)
  end

  it "walks every message when no target is given" do
    create(:message, attachment_count: 9)
    described_class.call
    expect(Message.pluck(:attachment_count)).to all(eq(0))
  end
end
