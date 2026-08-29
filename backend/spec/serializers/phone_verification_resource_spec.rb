require "rails_helper"

RSpec.describe PhoneVerificationResource do
  it "serialises an issued request" do
    issued = PhoneVerifications::Issued.new(
      code: "123456", wa_url: "https://wa.me/1", expires_at: Time.utc(2026, 1, 1),
      status: "pending", confirmed_phone: nil, phone_changed: false
    )
    json = described_class.new(issued).to_h

    expect(json.fetch("code")).to eq("123456")
    expect(json.fetch("expires_at")).to eq("2026-01-01T00:00:00Z")
    expect(json.fetch("status")).to eq("pending")
  end

  it "omits expires_at when missing" do
    issued = PhoneVerifications::Issued.new(
      code: nil, wa_url: nil, expires_at: nil, status: "none",
      confirmed_phone: nil, phone_changed: false
    )
    expect(described_class.new(issued).to_h.fetch("expires_at")).to be_nil
  end
end
