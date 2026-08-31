require "rails_helper"

RSpec.describe Ai::Providers::OpenRouter do
  it "returns missing_key when the OpenRouter key is blank" do
    provider = described_class.new

    expect(provider.chat(messages: [], model: "m")).to eq(:missing_key)
    expect(provider.stream_chat(messages: [], model: "m")).to eq(:missing_key)
  end

  it "sends Referer and title headers when a key is present" do
    stub_setting(:openrouter_api_key, "ork", category: "ai")
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, headers:, **_|
      captured = headers
      [ { "choices" => [ { "message" => { "content" => "ok" } } ] }, nil ]
    end
    allow(Ai::Providers::Http).to receive(:post_stream).and_return(nil)

    provider = described_class.new
    expect(provider.chat(messages: [ { role: "user", content: "q" } ], model: "m").text).to eq("ok")
    expect(captured["HTTP-Referer"]).to eq("https://rajya.pages.dev")
    expect(captured["X-Title"]).to eq("Rajya")
  end

  it "streams through the OpenAI-compatible client when a key is present" do
    stub_setting(:openrouter_api_key, "ork", category: "ai")
    allow(Ai::Providers::Http).to receive(:post_stream).and_return(nil)

    expect(described_class.new.stream_chat(messages: [], model: "m").text).to eq("")
  end
end
