require "rails_helper"

RSpec.describe PasskeyResource do
  it "exposes id, nickname, last_used_at and created_at" do
    passkey = create(:passkey, nickname: "Laptop", last_used_at: Time.zone.parse("2026-08-30 12:00:00"))
    json = described_class.new(passkey).to_h

    expect(json.fetch("id")).to eq(passkey.id)
    expect(json.fetch("nickname")).to eq("Laptop")
    expect(json.fetch("created_at")).to be_present
  end
end
