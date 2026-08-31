require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- HTTP request capture
RSpec.describe Ai::Providers::Groq do
  def stub_http(response)
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:open_timeout=)
    allow(http).to receive(:read_timeout=)
    allow(http).to receive(:request).and_return(response)
    http
  end

  def classify_double(klass, body:, code:, success: false)
    instance_double(klass, body: body, code: code).tap do |row|
      allow(row).to receive(:is_a?).with(Net::HTTPSuccess).and_return(success)
    end
  end

  before do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:groq_api_key).and_return("gkey")
  end

  it "posts audio to whisper and returns text plus language" do
    captured = nil
    http = stub_http(classify_double(Net::HTTPSuccess, body: { "text" => "hello", "language" => "en" }.to_json, code: "200", success: true))
    allow(http).to receive(:request) do |request|
      captured = request
      classify_double(Net::HTTPSuccess, body: { "text" => "hello", "language" => "en" }.to_json, code: "200", success: true)
    end

    result = described_class.new.transcribe(
      io: StringIO.new("ogg"), filename: "note.ogg", content_type: "audio/ogg", model: "whisper-large-v3"
    )

    expect(result).to have_attributes(text: "hello", language: "en")
    expect(captured["Authorization"]).to eq("Bearer gkey")
    expect(captured.body).to include("whisper-large-v3")
    expect(captured.body).to include("note.ogg")
  end

  it "returns missing_key when the Groq key is blank" do
    allow(Settings).to receive(:fetch).with(:groq_api_key).and_return("")
    provider = described_class.new

    expect(provider.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")).to eq(:missing_key)
    expect(provider.chat(messages: [], model: "m")).to eq(:missing_key)
    expect(provider.stream_chat(messages: [], model: "m")).to eq(:missing_key)
  end

  it "maps 429 onto quota_exhausted and 402 onto payment_required" do
    stub_http(classify_double(Net::HTTPTooManyRequests, body: "{}", code: "429"))
    expect(described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")).to eq(:quota_exhausted)

    stub_http(classify_double(Net::HTTPPaymentRequired, body: "{}", code: "402"))
    expect(described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")).to eq(:payment_required)
  end

  it "maps invalid JSON and transport errors" do
    stub_http(classify_double(Net::HTTPSuccess, body: "nope", code: "200", success: true))
    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: 'a"b.ogg', content_type: "audio/ogg", model: "w")
    ).to eq(:upstream_failed)

    allow(Net::HTTP).to receive(:new).and_raise(Errno::ECONNREFUSED)
    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:timeout)
  end

  it "maps a non-success HTTP response onto upstream_failed" do
    stub_http(classify_double(Net::HTTPBadRequest, body: "{}", code: "400"))

    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:upstream_failed)
  end

  it "delegates chat to the OpenAI-compatible client when a key is present" do
    allow(Ai::Providers::Http).to receive_messages(
      post_json: [ { "choices" => [ { "message" => { "content" => "ok" } } ] }, nil ],
      post_stream: nil
    )

    provider = described_class.new
    expect(provider.chat(messages: [ { role: "user", content: "q" } ], model: "m").text).to eq("ok")
    expect(provider.stream_chat(messages: [], model: "m").text).to eq("")
    expect(provider.capabilities).to include(:transcribe, :chat)
  end
end
# rubocop:enable RSpec/ExampleLength
