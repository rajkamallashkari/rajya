require "rails_helper"

RSpec.describe Calls::IceServers::Http do
  def response_double(code:, body:)
    instance_double(Net::HTTPResponse, body: body).tap do |response|
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(code == "200")
    end
  end

  def stub_http
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:open_timeout=)
    allow(http).to receive(:read_timeout=)
    http
  end

  it "parses JSON on success" do
    http = stub_http
    allow(http).to receive(:request).and_return(response_double(code: "200", body: "[1]"))
    expect(described_class.new.get_json(URI("https://example.test/turn"), timeout: 1)).to eq([ 1 ])
  end

  it "parses JSON over http" do
    http = stub_http
    allow(http).to receive(:request).and_return(response_double(code: "200", body: "[]"))
    expect(described_class.new.get_json(URI("http://example.test/turn"), timeout: 1)).to eq([])
  end

  it "returns nil on HTTP errors" do
    http = stub_http
    allow(http).to receive(:request).and_return(response_double(code: "500", body: "no"))
    expect(described_class.new.get_json(URI("https://example.test/turn"), timeout: 1)).to be_nil
  end

  it "returns nil on parse errors" do
    http = stub_http
    allow(http).to receive(:request).and_return(response_double(code: "200", body: "not-json"))
    expect(described_class.new.get_json(URI("https://example.test/turn"), timeout: 1)).to be_nil
  end

  it "returns nil on network errors" do
    http = stub_http
    allow(http).to receive(:request).and_raise(Timeout::Error)
    expect(described_class.new.get_json(URI("https://example.test/turn"), timeout: 1)).to be_nil
  end
end
