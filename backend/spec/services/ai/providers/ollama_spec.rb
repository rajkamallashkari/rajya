require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- chat, stream and embed payloads
RSpec.describe Ai::Providers::Ollama do
  it "returns a chat result and includes tools and images" do
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, body:, **_|
      captured = JSON.parse(body)
      [ { "message" => { "content" => "hi" }, "prompt_eval_count" => 1, "eval_count" => 2 }, nil ]
    end

    result = described_class.new.chat(
      messages: [ { role: "user", content: "q" } ], model: "llama3.2",
      tools: [ { "type" => "function" } ], images: [ "b64" ]
    )

    expect(result).to have_attributes(text: "hi", prompt_tokens: 1, completion_tokens: 2)
    expect(captured["tools"]).to be_present
    expect(captured["messages"].last["images"]).to eq([ "b64" ])
  end

  it "returns a chat error and skips images on an empty message list" do
    allow(Ai::Providers::Http).to receive(:post_json).and_return([ nil, :timeout ])
    expect(described_class.new.chat(messages: [], model: "m", images: [ "x" ])).to eq(:timeout)
  end

  it "streams NDJSON deltas and ignores junk" do
    allow(Ai::Providers::Http).to receive(:post_stream) do |_uri, **_, &block|
      block.call("{\"message\":{\"content\":\"A\"}}\n")
      block.call("not-json\n")
      block.call("\n")
      nil
    end
    deltas = []

    result = described_class.new.stream_chat(messages: [], model: "m") { |row| deltas << row }

    expect(result.text).to eq("A")
    expect(deltas).to eq([ "A" ])
    expect(described_class.new.stream_chat(messages: [], model: "m").text).to eq("A")
  end

  it "returns a stream error" do
    allow(Ai::Providers::Http).to receive(:post_stream).and_return(:timeout)

    expect(described_class.new.stream_chat(messages: [], model: "m")).to eq(:timeout)
  end

  it "embeds from embeddings or embedding keys and fails when both are blank" do
    allow(Ai::Providers::Http).to receive(:post_json).and_return(
      [ { "embeddings" => [ [ 0.1 ] ] }, nil ],
      [ { "embedding" => [ 0.2 ] }, nil ],
      [ {}, nil ],
      [ nil, :timeout ]
    )
    provider = described_class.new

    expect(provider.embed(texts: [ "a" ], model: "nomic").vectors).to eq([ [ 0.1 ] ])
    expect(provider.embed(texts: [ "a" ], model: "nomic").vectors).to eq([ [ 0.2 ] ])
    expect(provider.embed(texts: [ "a" ], model: "nomic")).to eq(:upstream_failed)
    expect(provider.embed(texts: [ "a" ], model: "nomic")).to eq(:timeout)
  end

  it "declares embed as a capability" do
    expect(described_class.new.capabilities).to include(:embed)
  end
end
# rubocop:enable RSpec/ExampleLength
