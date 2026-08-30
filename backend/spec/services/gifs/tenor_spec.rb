require "rails_helper"

RSpec.describe Gifs::Tenor do
  def json_response(code, body)
    instance_double(Net::HTTPSuccess, is_a?: code == "200", code: code, body: body)
  end

  def stub_get(uri, response)
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).with(uri.host, uri.port).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(response)
  end

  it "maps search hits and skips rows without a gif url" do
    stub_setting(:tenor_api_key, "k", category: "media")
    uri = URI("https://tenor.googleapis.com/v2/search?q=party&limit=#{Settings.fetch(:gif_search_limit)}&client_key=rajya&key=k&media_filter=gif%2Ctinygif")
    payload = {
      "results" => [
        { "id" => "1", "title" => "A", "media_formats" => { "gif" => { "url" => "https://cdn.example/a.gif" }, "tinygif" => { "url" => "https://cdn.example/t.gif" } } },
        { "id" => "2", "title" => "B", "media_formats" => {} }
      ]
    }
    allow(Net::HTTP).to receive(:new).and_return(instance_double(Net::HTTP, :use_ssl= => true, request: json_response("200", payload.to_json)))

    hits = described_class.new.search("party")
    expect(hits.sole).to have_attributes(id: "1", title: "A", preview_url: "https://cdn.example/t.gif", gif_url: "https://cdn.example/a.gif")
  end

  it "returns missing_key without a configured key and upstream_failed on a bad body" do
    expect(described_class.new.search("party")).to eq(:missing_key)
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(json_response("200", "nope"))
    expect(described_class.new.search("party")).to eq(:upstream_failed)
    allow(http).to receive(:request).and_return(instance_double(Net::HTTPResponse, is_a?: false, code: "500", body: ""))
    expect(described_class.new.search("party")).to eq(:upstream_failed)
  end

  it "returns missing_key from fetch when the API key is blank" do
    expect(described_class.new.fetch("1")).to eq(:missing_key)
  end

  it "fetches a single gif and downloads bytes" do
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    payload = { "results" => [ { "id" => "1", "title" => "A", "media_formats" => { "gif" => { "url" => "https://cdn.example/a.gif" } } } ] }
    allow(http).to receive(:request).and_return(json_response("200", payload.to_json), json_response("200", "GIF89a"))

    hit = described_class.new.fetch("1")
    expect(hit.gif_url).to eq("https://cdn.example/a.gif")
    expect(described_class.new.download("https://cdn.example/a.gif")).to eq("GIF89a")
    expect(described_class.new.download("not a url")).to be_nil
  end

  it "returns nil when fetch has no results" do
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(json_response("200", { "results" => [] }.to_json))
    expect(described_class.new.fetch("1")).to be_nil
  end

  it "returns upstream_failed from fetch on a bad body" do
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(json_response("200", "nope"))
    expect(described_class.new.fetch("1")).to eq(:upstream_failed)
  end

  it "skips downloads with a blank host or failed response" do
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(instance_double(Net::HTTPResponse, is_a?: false, code: "500", body: ""))
    expect(described_class.new.download("https://cdn.example/a.gif")).to be_nil
    expect(described_class.new.download("http://")).to be_nil
  end

  it "downloads over http" do
    stub_setting(:tenor_api_key, "k", category: "media")
    http = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http)
    allow(http).to receive(:use_ssl=)
    allow(http).to receive(:request).and_return(json_response("200", "GIF89a"))
    expect(described_class.new.download("http://cdn.example/a.gif")).to eq("GIF89a")
  end
end
