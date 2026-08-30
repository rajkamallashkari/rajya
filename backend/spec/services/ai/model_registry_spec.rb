require "rails_helper"

RSpec.describe Ai::ModelRegistry do
  it "parses the transcribe chain from settings" do
    chain = described_class.chain_for(:transcribe)

    expect(chain.sole).to have_attributes(provider: "groq", model: "whisper-large-v3")
    expect(described_class.provider_for("groq")).to be_a(Ai::Providers::Groq)
    expect(described_class.provider_for("ollama")).to be_nil
  end

  it "skips malformed model tokens" do
    allow(Settings).to receive(:fetch).with(:ai_transcribe_models).and_return([ "groq/", "/model", "ok" ])

    expect(described_class.chain_for(:transcribe)).to eq([])
  end

  it "raises in local environments for an unregistered capability" do
    expect { described_class.chain_for(:bot_reply) }.to raise_error(Ai::ModelRegistry::UnregisteredCapability)
  end

  it "returns an empty chain in production for an unregistered capability" do
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production"))

    expect(described_class.chain_for(:bot_reply)).to eq([])
  end
end
