require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- provider chain and usage events
RSpec.describe Ai::Runner do
  def voice_io
    StringIO.new("ogg")
  end

  it "returns a successful transcript and writes a usage event" do
    account = create(:account)
    conversation = create(:conversation)
    hit = Ai::Providers::Groq::Transcript.new(text: "hi", language: "en")
    groq = instance_double(Ai::Providers::Groq, transcribe: hit)
    allow(Ai::ModelRegistry).to receive_messages(
      chain_for: [ Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-large-v3") ],
      provider_for: groq
    )

    result = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: account, conversation: conversation
    )

    expect(result.status).to eq("success")
    expect(result.transcript.text).to eq("hi")
    expect(AiUsageEvent.last).to have_attributes(capability: "transcribe", status: "success", account: account)
  end

  it "tries the next model after a provider failure and records both attempts" do
    first = Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-large-v3")
    second = Ai::ModelRegistry::Entry.new(provider: "groq", model: "whisper-fallback")
    groq = instance_double(Ai::Providers::Groq)
    allow(groq).to receive(:transcribe).and_return(:quota_exhausted, Ai::Providers::Groq::Transcript.new(text: "ok", language: "en"))
    allow(Ai::ModelRegistry).to receive(:chain_for).with(:transcribe).and_return([ first, second ])
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(groq)

    result = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: create(:account), conversation: create(:conversation)
    )

    expect(result.status).to eq("success")
    expect(AiUsageEvent.pluck(:status)).to eq(%w[failed success])
  end

  it "returns failed when every provider misses and when the chain is empty" do
    allow(Ai::ModelRegistry).to receive(:chain_for).with(:transcribe).and_return(
      [ Ai::ModelRegistry::Entry.new(provider: "missing", model: "x") ]
    )
    allow(Ai::ModelRegistry).to receive(:provider_for).and_return(nil)

    missed = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: nil, conversation: nil
    )
    expect(missed.status).to eq("failed")
    expect(missed.error_code).to eq("upstream_failed")

    allow(Ai::ModelRegistry).to receive(:chain_for).with(:transcribe).and_return([])
    empty = described_class.transcribe(
      io: voice_io, filename: "a.ogg", content_type: "audio/ogg",
      account: nil, conversation: nil
    )
    expect(empty.provider).to eq("none")
  end
end
# rubocop:enable RSpec/ExampleLength
