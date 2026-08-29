require "rails_helper"

RSpec.describe Auth::Passkeys::AssertLock do
  def disable!(key)
    create(:feature_flag, key: key.to_s, description: FeatureFlagRegistry.description_for(key), enabled: false)
  end

  it "accepts a valid lock assertion without issuing a session" do
    user = create(:user)
    client = webauthn_client
    register_passkey!(user, client)
    options = Auth::Passkeys::LockOptions.call(user: user).value
    result = described_class.call(
      user: user,
      credential: webauthn_assertion(client, webauthn_challenge(options))
    )

    expect(result).to be_success
    expect(result.value).to be(true)
    expect(user.passkeys.first.reload.last_used_at).to be_present
  end

  it "returns unauthenticated when the passkey is not this user's" do
    user = create(:user)
    Auth::Passkeys::LockOptions.call(user: user)
    result = described_class.call(user: user, credential: { "id" => "missing" })

    expect(result.error_code).to eq(:unauthenticated)
  end

  it "returns validation_failed when the challenge is missing" do
    expect(described_class.call(user: create(:user), credential: { "id" => "x" }).error_code)
      .to eq(:validation_failed)
  end

  it "returns validation_failed when the credential is blank" do
    expect(described_class.call(user: create(:user), credential: nil).error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when app_lock is off" do
    disable!(:app_lock)

    expect(described_class.call(user: create(:user), credential: {}).error_code).to eq(:not_found)
  end

  it "hides the endpoint when passkey_auth is off" do
    disable!(:passkey_auth)

    expect(described_class.call(user: create(:user), credential: {}).error_code).to eq(:not_found)
  end

  it "returns unauthenticated for a cloned authenticator" do
    user = create(:user)
    client = webauthn_client
    passkey = register_passkey!(user, client)
    options = Auth::Passkeys::LockOptions.call(user: user).value
    assertion = webauthn_assertion(client, webauthn_challenge(options))
    passkey.update!(sign_count: passkey.sign_count + 1)
    result = described_class.call(user: user, credential: assertion)

    expect(result.error_code).to eq(:unauthenticated)
  end

  it "returns validation_failed for a malformed assertion" do
    user = create(:user)
    client = webauthn_client
    register_passkey!(user, client)
    Auth::Passkeys::LockOptions.call(user: user)
    result = described_class.call(
      user: user,
      credential: { "id" => user.passkeys.first.webauthn_credential_id, "type" => "public-key", "response" => {} }
    )

    expect(result.error_code).to eq(:validation_failed)
  end
end
