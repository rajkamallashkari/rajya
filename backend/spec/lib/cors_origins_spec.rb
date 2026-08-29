require "rails_helper"

RSpec.describe CorsOrigins do
  it "allows the configured frontend origin and Pages" do
    expect(described_class.allowed?("http://localhost:5173")).to be(true)
    expect(described_class.allowed?("https://rajya.pages.dev")).to be(true)
  end

  it "allows a trycloudflare tunnel hostname" do
    expect(described_class.allowed?("https://abc-def.trycloudflare.com")).to be(true)
  end

  it "rejects a blank or unknown origin" do
    expect(described_class.allowed?(nil)).to be(false)
    expect(described_class.allowed?("https://evil.example")).to be(false)
  end

  it "reads FRONTEND_ORIGIN from the environment" do
    allow(ENV).to receive(:fetch).with("FRONTEND_ORIGIN", described_class::LOCALHOST).and_return("https://custom.example")

    expect(described_class.frontend_origin).to eq("https://custom.example")
    expect(described_class.list).to include("https://custom.example")
  end
end
