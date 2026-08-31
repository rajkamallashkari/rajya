require "rails_helper"

RSpec.describe Ai::Provider do
  it "returns unsupported for unused seams and an empty capability list" do
    provider = described_class.new

    expect(provider.chat(messages: [], model: "x")).to eq(:unsupported)
    expect(provider.embed(texts: [], model: "x")).to eq(:unsupported)
    expect(provider.generate_image(prompt: "x", model: "x")).to eq(:unsupported)
  end

  it "returns unsupported for transcription and an empty capability list" do
    provider = described_class.new

    expect(provider.transcribe(io: nil, filename: "a", content_type: "b", model: "x")).to eq(:unsupported)
    expect(provider.capabilities).to eq([])
  end

  it "yields a chat result once when a subclass does not override streaming" do
    provider = Class.new(described_class) do
      def chat(**)
        Ai::Provider::ChatResult.new(text: "hi")
      end
    end.new
    deltas = []

    expect(provider.stream_chat(messages: [], model: "x") { |delta| deltas << delta }.text).to eq("hi")
    expect(deltas).to eq([ "hi" ])
    expect(provider.stream_chat(messages: [], model: "x").text).to eq("hi")
  end

  it "does not yield when chat is unsupported or blank" do
    deltas = []
    described_class.new.stream_chat(messages: [], model: "x") { |delta| deltas << delta }
    blank = Class.new(described_class) do
      def chat(**)
        Ai::Provider::ChatResult.new(text: "")
      end
    end.new
    blank.stream_chat(messages: [], model: "x") { |delta| deltas << delta }

    expect(deltas).to eq([])
  end
end
