require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- request body and SSE
RSpec.describe Ai::Providers::OpenAiCompatible do
  def provider
    Class.new(described_class) do
      def api_key = "k"
      def host = "example.test"
      def chat_path = "/v1/chat"
    end.new
  end

  def stub_json(payload, error = nil)
    allow(Ai::Providers::Http).to receive(:post_json).and_return([ payload, error ])
  end

  it "returns a chat result and includes tools and images in the body" do
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, headers:, body:, timeout:|
      captured = { headers: headers, body: JSON.parse(body), timeout: timeout }
      [ { "choices" => [ { "message" => { "content" => "hi" } } ], "usage" => { "prompt_tokens" => 1, "completion_tokens" => 2 } }, nil ]
    end

    result = provider.chat(
      messages: [ { role: "user", content: "q" } ], model: "m",
      tools: [ { "type" => "function" } ], images: [ "https://img" ]
    )

    expect(result).to have_attributes(text: "hi", prompt_tokens: 1, completion_tokens: 2)
    expect(captured[:body]["tools"]).to eq([ { "type" => "function" } ])
    expect(captured[:body]["messages"].last["content"]).to include(hash_including("type" => "image_url"))
  end

  it "returns a provider error from chat" do
    stub_json(nil, :quota_exhausted)

    expect(provider.chat(messages: [], model: "m")).to eq(:quota_exhausted)
  end

  it "streams SSE deltas and ignores done and junk lines" do
    allow(Ai::Providers::Http).to receive(:post_stream) do |_uri, **_, &block|
      block.call("data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n")
      block.call("data: [DONE]\n")
      block.call("not-data\n")
      block.call("data: {bad\n")
      block.call("\n")
      nil
    end
    deltas = []

    result = provider.stream_chat(messages: [ { role: "user", content: "q" } ], model: "m") { |row| deltas << row }

    expect(result.text).to eq("A")
    expect(deltas).to eq([ "A" ])
    expect(provider.capabilities).to include(:chat)
    expect(provider.stream_chat(messages: [ { role: "user", content: "q" } ], model: "m").text).to eq("A")
  end

  it "returns a stream error and skips images when the message list is empty" do
    allow(Ai::Providers::Http).to receive(:post_stream).and_return(:timeout)
    expect(provider.stream_chat(messages: [], model: "m")).to eq(:timeout)

    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, body:, **_|
      captured = JSON.parse(body)
      [ { "choices" => [ { "message" => { "content" => "" } } ] }, nil ]
    end
    provider.chat(messages: [], model: "m", images: [ "x" ])
    expect(captured["messages"]).to eq([])
  end

  it "reads string-key message content when attaching images" do
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, body:, **_|
      captured = JSON.parse(body)
      [ { "choices" => [ { "message" => { "content" => "ok" } } ] }, nil ]
    end

    provider.chat(messages: [ { "role" => "user", "content" => "q" } ], model: "m", images: [ "https://img" ])
    expect(captured["messages"].last["content"]).to include(hash_including("type" => "text"))
  end

  it "requires subclasses to define host, path and key" do
    provider = described_class.new

    expect { provider.send(:api_key) }.to raise_error(NotImplementedError)
    expect { provider.send(:host) }.to raise_error(NotImplementedError)
    expect { provider.send(:chat_path) }.to raise_error(NotImplementedError)
  end
end
# rubocop:enable RSpec/ExampleLength
