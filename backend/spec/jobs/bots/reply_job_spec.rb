require "rails_helper"

RSpec.describe Bots::ReplyJob do
  def setup
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    trigger = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ conversation, trigger, bot ]
  end

  it "delegates to Bots::Generate" do
    conversation, trigger, bot = setup
    allow(Bots::Generate).to receive(:call).and_return(Result.success(nil))

    described_class.perform_now(conversation.id, trigger.id, bot.id)

    expect(Bots::Generate).to have_received(:call).with(
      conversation: conversation, bot: bot, triggered_by: trigger, regenerate_of_message_id: nil
    )
  end

  it "retries StandardError using the reply retry setting (BR-78)" do
    expect(described_class.retry_attempts).to eq(Settings.fetch(:ai_reply_retry_attempts))
    expect(described_class.rescue_handlers.map(&:first)).to include("StandardError")
  end

  it "raises on upstream_failed so the job retries (BR-78)" do
    conversation, trigger, bot = setup
    allow(Bots::Generate).to receive(:call).and_return(Result.failure(:upstream_failed))
    job = described_class.new(conversation.id, trigger.id, bot.id)

    expect {
      job.perform(conversation.id, trigger.id, bot.id)
    }.to raise_error(StandardError, "upstream_failed")
  end

  it "does not raise when records are missing or Generate returns not_found" do
    conversation, trigger, bot = setup
    allow(Bots::Generate).to receive(:call).and_return(Result.failure(:not_found))

    expect { described_class.perform_now(conversation.id, trigger.id, bot.id) }.not_to raise_error
    expect { described_class.perform_now(0, trigger.id, bot.id) }.not_to raise_error
  end

  it "passes a regenerate_of message id through" do
    conversation, trigger, bot = setup
    allow(Bots::Generate).to receive(:call).and_return(Result.success(nil))

    described_class.perform_now(conversation.id, trigger.id, bot.id, 99)

    expect(Bots::Generate).to have_received(:call).with(
      hash_including(regenerate_of_message_id: 99)
    )
  end
end
