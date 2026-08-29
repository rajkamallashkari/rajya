require "rails_helper"

RSpec.describe Auth::Passkeys::RegistrationOptions do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "returns creation options and assigns a webauthn_handle" do
    user = create(:user, webauthn_handle: nil)
    result = described_class.call(user: user)

    expect(result).to be_success
    expect(user.reload.webauthn_handle).to be_present
    expect(webauthn_challenge(result.value)).to be_present
  end

  it "reuses an existing webauthn_handle" do
    user = create(:user, webauthn_handle: "already-set")
    described_class.call(user: user)

    expect(user.reload.webauthn_handle).to eq("already-set")
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(user: create(:user)).error_code).to eq(:not_found)
  end

  it "uses the username when the user has no email" do
    user = create(:user, email: nil)
    result = described_class.call(user: user)

    expect(webauthn_challenge(result.value)).to be_present
  end
end
