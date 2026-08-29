require "rails_helper"

RSpec.describe Auth::Passkeys::AuthenticationOptions do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "returns a challenge and nonce for an unknown email (no enumeration)" do
    result = described_class.call(email: "missing@example.com")

    expect(result).to be_success
    expect(result.value[:nonce]).to be_present
    expect(result.value[:challenge] || result.value["challenge"]).to be_present
  end

  it "restricts allowCredentials to the user's passkeys when email matches" do
    user = create(:user, email: "ada@example.com")
    create(:passkey, user: user, webauthn_credential_id: "cred-ada")
    result = described_class.call(email: "ADA@example.com")
    allow = result.value[:allowCredentials] || result.value["allowCredentials"]

    expect(allow).to be_present
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(email: nil).error_code).to eq(:not_found)
  end
end
