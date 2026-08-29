require "rails_helper"

RSpec.describe Passkey do
  it "is valid with a credential id and public key" do
    expect(build(:passkey)).to be_valid
  end

  it "requires a nickname" do
    passkey = build(:passkey, nickname: nil)

    expect(passkey).not_to be_valid
    expect(passkey.errors[:nickname]).to be_present
  end

  it "rejects a duplicate webauthn_credential_id" do
    create(:passkey, webauthn_credential_id: "same")

    expect(build(:passkey, webauthn_credential_id: "same")).not_to be_valid
  end
end
