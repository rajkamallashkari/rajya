require "rails_helper"

RSpec.describe Whatsapp::Signature do
  it "rejects a blank secret or missing header" do
    configure_whatsapp!(secret: "")
    expect(described_class.valid?("{}", "sha256=abc")).to be(false)

    configure_whatsapp!(secret: "hub-secret")
    expect(described_class.valid?("{}", nil)).to be(false)
  end

  it "accepts a matching HMAC and rejects a mismatch" do
    configure_whatsapp!
    body = "{}"
    expect(described_class.valid?(body, whatsapp_signature(body))).to be(true)
    expect(described_class.valid?(body, "sha256=deadbeef")).to be(false)
  end
end
