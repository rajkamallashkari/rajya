require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- Gemini payload mapping
RSpec.describe Ai::Providers::Gemini do
  it "returns missing_key when the Studio key is blank" do
    expect(described_class.new.chat(messages: [], model: "gemini-2.5-flash")).to eq(:missing_key)
  end

  it "maps contents, system instruction, tools and images" do
    stub_setting(:gemini_api_key, "gk", category: "ai")
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |uri, body:, **_|
      captured = { uri: uri, body: JSON.parse(body) }
      [ { "candidates" => [ { "content" => { "parts" => [ { "text" => "hi" } ] } } ],
          "usageMetadata" => { "promptTokenCount" => 1, "candidatesTokenCount" => 2 } }, nil ]
    end

    result = described_class.new.chat(
      messages: [ { role: "system", content: "sys" }, { role: "user", content: "q" }, { role: "assistant", content: "a" } ],
      model: "gemini-2.5-flash", tools: [ { "fn" => 1 } ], images: [ "https://img" ]
    )

    expect(result).to have_attributes(text: "hi", prompt_tokens: 1, completion_tokens: 2)
    expect(captured[:uri].query).to include("key=gk")
    expect(captured[:body]["systemInstruction"]["parts"].sole["text"]).to eq("sys")
    expect(captured[:body]["contents"].last["role"]).to eq("model")
  end

  it "returns a provider error and lists chat capabilities" do
    stub_setting(:gemini_api_key, "gk", category: "ai")
    allow(Ai::Providers::Http).to receive(:post_json).and_return([ nil, :quota_exhausted ])

    expect(described_class.new.chat(messages: [ { role: "user", content: "q" } ], model: "m")).to eq(:quota_exhausted)
    expect(described_class.new.capabilities).to include(:chat, :stream_chat)
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, body:, **_|
      expect(JSON.parse(body)["tools"]).to eq([ { "fn" => 1 } ])
      [ { "candidates" => [ { "content" => { "parts" => [ { "text" => "x" } ] } } ] }, nil ]
    end
    described_class.new.chat(messages: [ { role: "user", content: "q" } ], model: "m", tools: [ { "fn" => 1 } ])
  end

  it "reads string-key roles when assembling Gemini contents" do
    stub_setting(:gemini_api_key, "gk", category: "ai")
    captured = nil
    allow(Ai::Providers::Http).to receive(:post_json) do |_uri, body:, **_|
      captured = JSON.parse(body)
      [ { "candidates" => [ { "content" => { "parts" => [ { "text" => "ok" } ] } } ] }, nil ]
    end

    described_class.new.chat(messages: [ { "role" => "user", "content" => "q" } ], model: "m")
    expect(captured["contents"].sole["role"]).to eq("user")
  end
end
# rubocop:enable RSpec/ExampleLength
