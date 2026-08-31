require "rails_helper"

RSpec.describe Bots::Generate do
  def setup
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    trigger = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, bot, conversation, trigger ]
  end

  def stub_stream(text: "hello", cancelled: false, status: "success", error_code: nil)
    allow(Ai::Runner).to receive(:stream_chat) do |**_kwargs, &block|
      block&.call(text) if text.present?
      Ai::Runner::Result.new(
        text: text, status: status, cancelled: cancelled, error_code: error_code,
        provider: "groq", model: "llama"
      )
    end
  end

  before { allow(Ai::ConversationSummary).to receive(:maybe_summarize!) }

  it "streams chunks then persists the completed reply" do
    _user, bot, conversation, trigger = setup
    stub_stream(text: "hello")
    captured = []
    allow(ActionCable.server).to receive(:broadcast) { |_stream, payload| captured << payload }

    result = described_class.call(conversation: conversation, bot: bot, triggered_by: trigger)
    reply = conversation.messages.where(sender_account: bot.account).order(:id).last

    expect(result).to be_success
    expect(reply.body).to eq("hello")
    expect(captured.pluck("type")).to include("generation_started", "generation_chunk", "message_created")
    expect(Ai::ConversationSummary).to have_received(:maybe_summarize!).with(conversation, account: bot.account)
  end

  it "persists accumulated text when cancelled mid-stream (BR-77)" do
    _user, bot, conversation, trigger = setup
    stub_stream(text: "partial", cancelled: true)

    described_class.call(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(conversation.messages.visible.where(sender_account: bot.account).sole.body).to eq("partial")
  end

  it "persists nothing when cancelled with an empty buffer (BR-77)" do
    _user, bot, conversation, trigger = setup
    stub_stream(text: "", cancelled: true)

    described_class.call(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(conversation.messages.where(sender_account: bot.account)).to be_empty
  end

  it "does not persist on upstream failure and returns upstream_failed (BR-78)" do
    _user, bot, conversation, trigger = setup
    stub_stream(text: "", status: "failed", error_code: "timeout")

    result = described_class.call(conversation: conversation, bot: bot, triggered_by: trigger)

    expect(result.error_code).to eq(:upstream_failed)
    expect(conversation.messages.where(sender_account: bot.account)).to be_empty
  end

  it "returns the existing row when the synthetic nonce already exists (BR-76)" do
    _user, bot, conversation, trigger = setup
    stub_stream(text: "first")
    first = described_class.call(conversation: conversation, bot: bot, triggered_by: trigger).value
    stub_stream(text: "second")
    second = described_class.call(conversation: conversation, bot: bot, triggered_by: trigger).value

    expect(second.id).to eq(first.id)
    expect(conversation.messages.where(sender_account: bot.account).count).to eq(1)
  end

  it "returns not_found when the conversation, bot, or trigger is missing" do
    expect(described_class.call(conversation: nil, bot: nil, triggered_by: nil).error_code).to eq(:not_found)
  end
end
