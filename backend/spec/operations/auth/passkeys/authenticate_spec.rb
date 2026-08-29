require "rails_helper"

RSpec.describe Auth::Passkeys::Authenticate do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "returns a session for a valid assertion" do
    user = create(:user)
    client = webauthn_client
    register_passkey!(user, client)
    options = Auth::Passkeys::AuthenticationOptions.call(email: user.email).value
    result = described_class.call(
      credential: webauthn_assertion(client, webauthn_challenge(options)),
      nonce: options[:nonce] || options["nonce"]
    )

    expect(result).to be_success
    expect(result.value.user).to eq(user)
  end

  it "returns unauthenticated when the passkey is unknown" do
    options = Auth::Passkeys::AuthenticationOptions.call(email: nil).value
    result = described_class.call(
      credential: { "id" => "missing", "type" => "public-key", "response" => {} },
      nonce: options[:nonce] || options["nonce"]
    )

    expect(result.error_code).to eq(:unauthenticated)
  end

  it "returns validation_failed when the nonce is missing or spent" do
    expect(described_class.call(credential: { "id" => "x" }, nonce: nil).error_code).to eq(:validation_failed)
    expect(described_class.call(credential: { "id" => "x" }, nonce: "gone").error_code).to eq(:validation_failed)
  end

  it "returns validation_failed when the credential is blank" do
    expect(described_class.call(credential: nil, nonce: "n").error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(credential: {}, nonce: "n").error_code).to eq(:not_found)
  end

  it "returns unauthenticated for a cloned authenticator" do
    user = create(:user)
    client = webauthn_client
    passkey = register_passkey!(user, client)
    options = Auth::Passkeys::AuthenticationOptions.call(email: user.email).value
    assertion = webauthn_assertion(client, webauthn_challenge(options))
    passkey.update!(sign_count: passkey.sign_count + 1)
    result = described_class.call(credential: assertion, nonce: options[:nonce] || options["nonce"])

    expect(result.error_code).to eq(:unauthenticated)
  end

  it "returns validation_failed for a malformed assertion" do
    user = create(:user)
    client = webauthn_client
    register_passkey!(user, client)
    options = Auth::Passkeys::AuthenticationOptions.call(email: user.email).value
    result = described_class.call(
      credential: { "id" => user.passkeys.first.webauthn_credential_id, "type" => "public-key", "response" => {} },
      nonce: options[:nonce] || options["nonce"]
    )

    expect(result.error_code).to eq(:validation_failed)
  end

  it "returns unauthenticated for a deactivated account" do
    user = create(:user)
    client = webauthn_client
    register_passkey!(user, client)
    user.account.update!(deactivated_at: Time.current)
    options = Auth::Passkeys::AuthenticationOptions.call(email: user.email).value
    result = described_class.call(
      credential: webauthn_assertion(client, webauthn_challenge(options)),
      nonce: options[:nonce] || options["nonce"]
    )

    expect(result.error_code).to eq(:unauthenticated)
  end
end
