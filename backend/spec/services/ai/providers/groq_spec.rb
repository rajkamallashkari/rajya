require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- HTTP request capture
RSpec.describe Ai::Providers::Groq do
  def stub_http(response)
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(response)
    http
  end

  def classify_double(klass, body:, success: false, quota: false, payment: false)
    instance_double(klass, body: body).tap do |row|
      allow(row).to receive(:is_a?).with(Net::HTTPTooManyRequests).and_return(quota)
      allow(row).to receive(:is_a?).with(Net::HTTPPaymentRequired).and_return(payment)
      allow(row).to receive(:is_a?).with(Net::HTTPSuccess).and_return(success)
    end
  end

  before do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:groq_api_key).and_return("gkey")
  end

  it "posts audio to whisper and returns text plus language" do
    captured = nil
    http = stub_http(classify_double(Net::HTTPSuccess, body: { "text" => "hello", "language" => "en" }.to_json, success: true))
    allow(http).to receive(:request) do |request|
      captured = request
      classify_double(Net::HTTPSuccess, body: { "text" => "hello", "language" => "en" }.to_json, success: true)
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

    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:missing_key)
  end

  it "maps 429 onto quota_exhausted" do
    stub_http(classify_double(Net::HTTPTooManyRequests, body: "{}", quota: true))

    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:quota_exhausted)
  end

  it "maps a payment-required response onto quota_exhausted" do
    stub_http(classify_double(Net::HTTPPaymentRequired, body: "{}", payment: true))

    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:quota_exhausted)
  end

  it "maps invalid JSON and transport errors onto upstream_failed" do
    stub_http(classify_double(Net::HTTPSuccess, body: "nope", success: true))
    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: 'a"b.ogg', content_type: "audio/ogg", model: "w")
    ).to eq(:upstream_failed)

    allow(Net::HTTP).to receive(:new).and_raise(Errno::ECONNREFUSED)
    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:upstream_failed)
  end

  it "maps a non-success HTTP response onto upstream_failed" do
    stub_http(classify_double(Net::HTTPBadRequest, body: "{}"))

    expect(
      described_class.new.transcribe(io: StringIO.new("x"), filename: "a.ogg", content_type: "audio/ogg", model: "w")
    ).to eq(:upstream_failed)
  end
end
# rubocop:enable RSpec/ExampleLength
