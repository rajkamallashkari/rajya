require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- HTTP status matrix
RSpec.describe Ai::Providers::Http do
  def stub_http
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:open_timeout=)
    allow(http).to receive(:read_timeout=)
    http
  end

  def uri
    URI::HTTPS.build(host: "example.test", path: "/v1")
  end

  it "parses a JSON success body" do
    http = stub_http
    response = instance_double(Net::HTTPSuccess, code: "200", body: { "ok" => true }.to_json)
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
    allow(http).to receive(:request).and_return(response)

    payload, error = described_class.post_json(uri, headers: { "X" => "1" }, body: "{}", timeout: 5)

    expect(payload).to eq("ok" => true)
    expect(error).to be_nil
  end

  it "maps HTTP errors, invalid JSON and transport failures" do
    http = stub_http
    denied = instance_double(Net::HTTPTooManyRequests, code: "429", body: "{}")
    allow(denied).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
    allow(http).to receive(:request).and_return(denied)
    expect(described_class.post_json(uri, headers: {}, body: "{}", timeout: 5)).to eq([ nil, :quota_exhausted ])

    success = instance_double(Net::HTTPSuccess, code: "200", body: "nope")
    allow(success).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
    allow(http).to receive(:request).and_return(success)
    expect(described_class.post_json(uri, headers: {}, body: "{}", timeout: 5)[1]).to eq(:upstream_failed)

    allow(http).to receive(:request).and_raise(Net::ReadTimeout)
    expect(described_class.post_json(uri, headers: {}, body: "{}", timeout: 5)[1]).to eq(:timeout)
  end

  it "streams success chunks and maps stream errors" do
    http = stub_http
    ok = instance_double(Net::HTTPSuccess, code: "200")
    allow(ok).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
    allow(ok).to receive(:read_body).and_yield("chunk")
    allow(http).to receive(:request).and_yield(ok)
    chunks = []
    expect(described_class.post_stream(uri, headers: {}, body: "{}", timeout: 5) { |row| chunks << row }).to be_nil
    expect(chunks).to eq([ "chunk" ])

    denied = instance_double(Net::HTTPNotFound, code: "404")
    allow(denied).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
    allow(http).to receive(:request).and_yield(denied)
    expect(described_class.post_stream(uri, headers: {}, body: "{}", timeout: 5) { nil }).to eq(:model_unavailable)

    allow(http).to receive(:request).and_raise(Errno::ECONNREFUSED)
    expect(described_class.post_stream(uri, headers: {}, body: "{}", timeout: 5) { nil }).to eq(:timeout)
  end

  it "opens a plain HTTP session for an http URI" do
    http = stub_http
    uri = URI.parse("http://ollama.test:11434/api/chat")
    response = instance_double(Net::HTTPSuccess, code: "200", body: "{}")
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
    allow(http).to receive(:request).and_return(response)

    described_class.post_json(uri, headers: {}, body: "{}", timeout: 5)

    expect(http).to have_received(:use_ssl=).with(false)
  end

  it "maps 401 and 402 onto skippable codes" do
    expect(described_class.classify(instance_double(Net::HTTPUnauthorized, code: "401"))).to eq(:missing_key)
    expect(described_class.classify(instance_double(Net::HTTPPaymentRequired, code: "402"))).to eq(:payment_required)
    expect(described_class.classify(instance_double(Net::HTTPBadRequest, code: "400"))).to eq(:upstream_failed)
  end
end
# rubocop:enable RSpec/ExampleLength
