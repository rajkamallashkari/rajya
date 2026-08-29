require "rails_helper"

RSpec.describe DeviceSessionResource do
  it "exposes device metadata and marks the current jti" do
    session = create(:session, device_label: "Phone", user_agent: "RajyaSpec/1.0", ip: "127.0.0.1")
    json = described_class.new(session, params: { current_jti: session.jti }).to_h

    expect(json).to include(
      "id" => session.id,
      "device_label" => "Phone",
      "user_agent" => "RajyaSpec/1.0",
      "ip" => "127.0.0.1",
      "current" => true,
      "revoked" => false
    )
    expect(json.fetch("last_seen_at")).to be_present
    expect(json.fetch("expires_at")).to be_present
  end

  it "marks a different jti as not current and a revoked row as revoked" do
    session = create(:session, :revoked, ip: nil)
    json = described_class.new(session, params: { current_jti: SecureRandom.uuid }).to_h

    expect(json.fetch("current")).to be(false)
    expect(json.fetch("revoked")).to be(true)
    expect(json.fetch("ip")).to be_nil
  end
end
