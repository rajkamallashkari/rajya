require "rails_helper"

RSpec.describe Auth::MagicLinks::Verify do
  def disable_flag!
    create(:feature_flag, key: "passwordless_auth",
                          description: FeatureFlagRegistry.description_for(:passwordless_auth), enabled: false)
  end

  it "signs in with a valid token" do
    user = create(:user)
    _record, raw = Auth::Codes.issue_token!(
      user: user, purpose: "login", destination: user.email, ttl_key: :magic_link_ttl
    )
    result = described_class.call(token: raw)

    expect(result).to be_success
    expect(result.value.user).to eq(user)
  end

  it "rejects an unknown token" do
    expect(described_class.call(token: "nope").error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(token: "x").error_code).to eq(:not_found)
  end
end
