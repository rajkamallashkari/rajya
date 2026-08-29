require "rails_helper"

RSpec.describe Auth::Passkeys::Register do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "persists a passkey from a valid attestation" do
    user = create(:user)
    client = webauthn_client
    result = described_class.call(
      user: user,
      credential: webauthn_attestation(user, client),
      nickname: "  MacBook  "
    )

    expect(result).to be_success
    expect(result.value.nickname).to eq("MacBook")
    expect(user.passkeys.count).to eq(1)
  end

  it "defaults the nickname from the catalog" do
    user = create(:user)
    result = described_class.call(user: user, credential: webauthn_attestation(user, webauthn_client), nickname: " ")

    expect(result.value.nickname).to eq(Catalog.t("passkeys.default_nickname"))
  end

  it "returns validation_failed when the challenge is missing" do
    expect(described_class.call(user: create(:user), credential: { "id" => "x" }, nickname: nil).error_code)
      .to eq(:validation_failed)
  end

  it "returns validation_failed when the credential is blank" do
    expect(described_class.call(user: create(:user), credential: nil, nickname: nil).error_code)
      .to eq(:validation_failed)
  end

  it "returns validation_failed for a malformed attestation" do
    user = create(:user)
    Auth::Passkeys::RegistrationOptions.call(user: user)
    result = described_class.call(
      user: user,
      credential: { "id" => "x", "type" => "public-key", "response" => {} },
      nickname: "Laptop"
    )

    expect(result.error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(user: create(:user), credential: {}, nickname: nil).error_code).to eq(:not_found)
  end
end
