require "rails_helper"

RSpec.describe Auth::Otp::Verify do
  def disable_flag!
    create(:feature_flag, key: "passwordless_auth",
                          description: FeatureFlagRegistry.description_for(:passwordless_auth), enabled: false)
  end

  it "signs in with a valid code" do
    user = create(:user)
    _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "login", destination: user.email)
    result = described_class.call(email: user.email, code: raw)

    expect(result).to be_success
    expect(result.value.user).to eq(user)
  end

  it "rejects an unknown email or wrong code uniformly (F-24)" do
    missing = described_class.call(email: "nobody@example.com", code: "000000")
    user = create(:user)
    Auth::Codes.issue_otp!(user: user, purpose: "login", destination: user.email)
    wrong = described_class.call(email: user.email, code: "000000")

    expect(missing.error_code).to eq(:validation_failed)
    expect(wrong.error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(email: "a@x.com", code: "000000").error_code).to eq(:not_found)
  end
end
