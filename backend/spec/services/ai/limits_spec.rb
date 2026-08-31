require "rails_helper"

RSpec.describe Ai::Limits do
  it "reads context window, summarization threshold and token limits from settings" do
    expect(described_class.context_window).to eq(20)
    expect(described_class.summarization_threshold).to eq(40)
    expect(described_class.prompt_minimum_length).to eq(80)
    expect(described_class.max_tokens).to eq(1_024)
  end

  it "reads stream timeout, fallback cap, temperature and cancel ttl from settings" do
    expect(described_class.stream_timeout).to eq(60)
    expect(described_class.fallback_attempt_cap).to eq(2)
    expect(described_class.temperature).to eq(0.9)
    expect(described_class.cancel_ttl).to eq(300)
  end

  it "reads bot-reply retry attempts from settings" do
    expect(described_class.reply_retry_attempts).to eq(3)
  end

  it "picks up context window and summarization threshold without a restart" do
    stub_setting(:ai_context_window, 5, category: "ai")
    stub_setting(:ai_summarization_threshold, 7, category: "ai")

    expect(described_class.context_window).to eq(5)
    expect(described_class.summarization_threshold).to eq(7)
  end
end
