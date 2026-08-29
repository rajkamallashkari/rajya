require "rails_helper"

RSpec.describe Auth::Google::Requester do
  it "posts a form body to the token endpoint" do
    uri = URI("https://example.test/token")
    response = instance_double(Net::HTTPResponse)
    allow(Net::HTTP).to receive(:post_form).and_return(response)

    expect(described_class.new.post_form(uri, "code" => "x")).to eq(response)
    expect(Net::HTTP).to have_received(:post_form).with(uri, "code" => "x")
  end

  it "GETs the profile URL with a Bearer token over TLS" do
    uri = URI("https://example.test/userinfo")
    http = instance_double(Net::HTTP)
    request = instance_double(Net::HTTP::Get)
    response = instance_double(Net::HTTPResponse)
    allow(Net::HTTP).to receive(:new).with("example.test", 443).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(Net::HTTP::Get).to receive(:new).with(uri).and_return(request)
    allow(request).to receive(:[]=)
    allow(http).to receive(:request).with(request).and_return(response)

    expect(described_class.new.get_with_bearer(uri, "tok")).to eq(response)
    expect(http).to have_received(:use_ssl=).with(true)
    expect(request).to have_received(:[]=).with("Authorization", "Bearer tok")
  end

  it "does not force TLS for an http profile URL" do
    uri = URI("http://example.test/userinfo")
    http = instance_double(Net::HTTP)
    request = instance_double(Net::HTTP::Get)
    allow(Net::HTTP).to receive(:new).with("example.test", 80).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(Net::HTTP::Get).to receive(:new).with(uri).and_return(request)
    allow(request).to receive(:[]=)
    allow(http).to receive(:request).and_return(instance_double(Net::HTTPResponse))

    described_class.new.get_with_bearer(uri, "tok")

    expect(http).to have_received(:use_ssl=).with(false)
  end
end
