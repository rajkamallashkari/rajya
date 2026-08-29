require "rails_helper"

RSpec.describe Auth::Passwords::Change do
  def disable_flag!
    create(:feature_flag, key: "email_password_auth",
                          description: FeatureFlagRegistry.description_for(:email_password_auth), enabled: false)
  end

  it "sets a password when the user has none, then signs in" do
    user = create(:user, password_digest: nil)
    result = described_class.call(
      user: user, current_password: nil, password: "password12", password_confirmation: "password12"
    )

    expect(result).to be_success
    expect(user.reload.authenticate("password12")).to eq(user)
  end

  it "changes the password, bumps credentials_epoch, and signs in" do
    user = create(:user, :with_password)
    result = described_class.call(
      user: user, current_password: "password12", password: "password99", password_confirmation: "password99"
    )

    expect(result).to be_success
    expect(user.reload.credentials_epoch).to eq(1)
    expect(user.authenticate("password99")).to eq(user)
  end

  it "rejects an incorrect current password" do
    user = create(:user, :with_password)
    result = described_class.call(
      user: user, current_password: "nope", password: "password99", password_confirmation: "password99"
    )

    expect(result.error_code).to eq(:validation_failed)
  end

  it "rejects a confirmation mismatch" do
    user = create(:user, password_digest: nil)
    result = described_class.call(
      user: user, current_password: nil, password: "password12", password_confirmation: "other"
    )

    expect(result.error_code).to eq(:validation_failed)
  end

  it "rejects a too-short password" do
    user = create(:user, password_digest: nil)
    result = described_class.call(
      user: user, current_password: nil, password: "short", password_confirmation: "short"
    )

    expect(result.error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!
    user = create(:user, :with_password)

    expect(described_class.call(
      user: user, current_password: "password12", password: "password99", password_confirmation: "password99"
    ).error_code).to eq(:not_found)
  end
end
