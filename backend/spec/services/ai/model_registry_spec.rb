require "rails_helper"

RSpec.describe Ai::ModelRegistry do
  it "parses the transcribe chain and resolves every named provider (NR-33)" do
    chain = described_class.chain_for(:transcribe)

    expect(chain.sole).to have_attributes(provider: "groq", model: "whisper-large-v3")
    expect(described_class.provider_for("groq")).to be_a(Ai::Providers::Groq)
    expect(described_class.provider_for("ollama")).to be_a(Ai::Providers::Ollama)
  end

  it "resolves Gemini and OpenRouter adapters (changes BR-72)" do
    expect(described_class.provider_for("gemini")).to be_a(Ai::Providers::Gemini)
    expect(described_class.provider_for("openrouter")).to be_a(Ai::Providers::OpenRouter)
  end

  it "skips malformed model tokens" do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:ai_transcribe_models).and_return([ "groq/", "/model", "ok" ])

    expect(described_class.chain_for(:transcribe)).to eq([])
  end

  it "raises in local environments for an unregistered capability" do
    expect { described_class.chain_for(:not_a_capability) }.to raise_error(Ai::ModelRegistry::UnregisteredCapability)
  end

  it "returns an empty chain in production for an unregistered capability" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

    expect(described_class.chain_for(:not_a_capability)).to eq([])
    expect(described_class.provider_for("missing")).to be_nil
  end

  it "truncates a chain by the fallback cap and honours a settings override (NR-8)" do
    stub_setting(:ai_fallback_attempt_cap, 0, category: "ai")
    stub_setting(:ai_bot_reply_models, [ "ollama/llama3.2", "groq/ignored" ], category: "ai")

    expect(described_class.chain_for(:bot_reply).sole).to have_attributes(provider: "ollama", model: "llama3.2")
    expect(described_class.registered?(:vision)).to be(true)
  end
end
