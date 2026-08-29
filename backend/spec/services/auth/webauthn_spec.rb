require "rails_helper"

RSpec.describe Auth::Webauthn do
  it "exposes the configured origin" do
    expect(described_class.origin).to eq(WebAuthn.configuration.allowed_origins.first)
  end

  it "reads the credential id from string or symbol keys" do
    expect(described_class.credential_id(id: "xyz")).to eq("xyz")
    expect(described_class.credential_id("id" => "abc")).to eq("abc")
  end

  it "returns nil for a blank credential" do
    expect(described_class.credential_id(nil)).to be_nil
    expect(described_class.credential_id({})).to be_nil
  end

  it "stringifies ActionController parameters" do
    params = ActionController::Parameters.new("id" => "from-params")

    expect(described_class.credential_id(params)).to eq("from-params")
  end

  it "maps a malformed attestation to WebAuthn::Error" do
    expect { described_class.verify_registration({ "id" => "x" }, "challenge") }
      .to raise_error(WebAuthn::Error)
  end

  it "maps a malformed assertion to WebAuthn::Error" do
    passkey = create(:passkey)

    expect { described_class.verify_assertion({ "id" => passkey.webauthn_credential_id }, "challenge", passkey) }
      .to raise_error(WebAuthn::Error)
  end
end
