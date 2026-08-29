require "rails_helper"

RSpec.describe Auth::Passwords::Reset do
  def disable_flag!
    create(:feature_flag, key: "email_password_auth",
                          description: FeatureFlagRegistry.description_for(:email_password_auth), enabled: false)
  end

  def token_for(user)
    _record, raw = Auth::Codes.issue_token!(
      user: user, purpose: "password_reset", destination: user.email, ttl_key: :password_reset_ttl
    )
    raw
  end

  it "sets the new password, bumps credentials_epoch, and signs in" do
    user = create(:user, :with_password)
    token = token_for(user)

    result = described_class.call(token: token, password: "newpass12", password_confirmation: "newpass12")

    expect(result).to be_success
    expect(user.reload.authenticate("newpass12")).to eq(user)
    expect(user.credentials_epoch).to eq(1)
  end

  it "rejects a missing or spent token" do
    expect(described_class.call(token: "nope", password: "newpass12", password_confirmation: "newpass12").error_code).to eq(:validation_failed)
  end

  it "rejects a short password" do
    token = token_for(create(:user))

    expect(described_class.call(token: token, password: "short", password_confirmation: "short").error_details[:password]).to be_present
  end

  it "rejects a confirmation mismatch" do
    token = token_for(create(:user))

    expect(described_class.call(token: token, password: "newpass12", password_confirmation: "otherpass").error_details[:password_confirmation]).to be_present
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(token: "x", password: "newpass12", password_confirmation: "newpass12").error_code).to eq(:not_found)
  end
end
