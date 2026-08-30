require "rails_helper"

RSpec.describe MediaUrlResource do
  it "exposes the signed URL and expiry" do
    expires = Time.current
    json = described_class.new(Attachments::UrlPayload.new(url: "https://r2.example/get", expires_at: expires)).to_h

    expect(json.fetch("url")).to eq("https://r2.example/get")
    expect(json.fetch("expires_at")).to eq(expires)
  end
end
