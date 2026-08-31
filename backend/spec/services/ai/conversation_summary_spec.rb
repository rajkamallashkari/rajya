require "rails_helper"

RSpec.describe Ai::ConversationSummary do
  def setup
    user = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(user.account, bot.account)
    [ user, bot, conversation ]
  end

  def fill(conversation, user, count)
    count.times { |index| Messages::Send.call(conversation: conversation, sender: user.account, body: "m#{index}").value }
  end

  it "writes a summary watermarked by the last message before the live window (BR-75)" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 3, category: "ai")
    stub_setting(:ai_context_window, 2, category: "ai")
    fill(conversation, user, 4)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "Compressed.", status: "success", provider: "groq", model: "llama")
    )

    described_class.maybe_summarize!(conversation, account: bot.account)
    conversation.reload
    before_window = conversation.messages.visible.order(:position).first(2)

    expect(conversation.context_summary).to eq("Compressed.")
    expect(conversation.summarized_through_message_id).to eq(before_window.last.id)
  end

  it "skips when the chat is under the threshold or already summarized through the window" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 3, category: "ai")
    stub_setting(:ai_context_window, 2, category: "ai")
    fill(conversation, user, 2)
    allow(Ai::Runner).to receive(:chat)

    described_class.maybe_summarize!(conversation, account: bot.account)
    expect(Ai::Runner).not_to have_received(:chat)
    expect(conversation.reload.context_summary).to be_nil
  end

  it "picks up a lower summarization threshold without a restart" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 2, category: "ai")
    stub_setting(:ai_context_window, 1, category: "ai")
    fill(conversation, user, 3)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "Short.", status: "success", provider: "ollama", model: "llama")
    )

    described_class.maybe_summarize!(conversation, account: bot.account)

    expect(conversation.reload.context_summary).to eq("Short.")
  end

  it "leaves the watermark alone when the model returns nothing" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 2, category: "ai")
    stub_setting(:ai_context_window, 1, category: "ai")
    fill(conversation, user, 3)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(status: "failed", error_code: "timeout", provider: "groq", model: "llama")
    )

    described_class.maybe_summarize!(conversation, account: bot.account)

    expect(conversation.reload.context_summary).to be_nil
  end

  it "skips when the live window already covers the whole chat" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 2, category: "ai")
    stub_setting(:ai_context_window, 10, category: "ai")
    fill(conversation, user, 3)
    allow(Ai::Runner).to receive(:chat)

    described_class.maybe_summarize!(conversation, account: bot.account)

    expect(Ai::Runner).not_to have_received(:chat)
  end

  it "skips when everything before the window is already watermarked" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 3, category: "ai")
    stub_setting(:ai_context_window, 2, category: "ai")
    fill(conversation, user, 4)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "Compressed.", status: "success", provider: "groq", model: "llama")
    )
    described_class.maybe_summarize!(conversation, account: bot.account)
    expect(conversation.reload.context_summary).to eq("Compressed.")
    expect(Ai::Runner).to have_received(:chat).once

    described_class.maybe_summarize!(Conversation.find(conversation.id), account: bot.account)

    expect(Ai::Runner).to have_received(:chat).once
  end

  # rubocop:disable RSpec/ExampleLength -- bot, orphan, and blank-success paths
  it "labels bot lines in the excerpt and ignores a blank model reply" do
    user, bot, conversation = setup
    stub_setting(:ai_summarization_threshold, 3, category: "ai")
    stub_setting(:ai_context_window, 2, category: "ai")
    fill(conversation, user, 2)
    Messages::Send.call(conversation: conversation, sender: bot.account, body: "bot line").value
    orphan = Messages::Send.call(conversation: conversation, sender: user.account, body: "nobody").value
    orphan.update_columns(sender_account_id: nil)
    fill(conversation, user, 2)
    captured = nil
    allow(Ai::Runner).to receive(:chat) do |**kwargs|
      captured = kwargs[:messages]
      Ai::Runner::Result.new(text: "   ", status: "success", provider: "groq", model: "llama")
    end

    described_class.maybe_summarize!(conversation, account: bot.account)

    expect(captured.last[:content]).to include("Bot: bot line")
    expect(captured.last[:content]).to include("User: nobody")
    expect(conversation.reload.context_summary).to be_nil
  end
  # rubocop:enable RSpec/ExampleLength
end
