require "rails_helper"

RSpec.describe Auth::Passwords::Register do
  def disable_flag!
    create(:feature_flag, key: "email_password_auth",
                          description: FeatureFlagRegistry.description_for(:email_password_auth), enabled: false)
  end

  it "creates a human account and returns a session" do
    result = described_class.call(email: "A@X.com", name: "Ada", password: "password12", password_confirmation: "password12")

    expect(result).to be_success
    expect(result.value.user.email).to eq("a@x.com")
    expect(result.value.account.display_name).to eq("Ada")
  end

  it "rejects a blank email or name" do
    expect(described_class.call(email: " ", name: "Ada", password: "password12", password_confirmation: "password12")).to be_failure
    expect(described_class.call(email: "a@x.com", name: " ", password: "password12", password_confirmation: "password12").error_code).to eq(:validation_failed)
  end

  it "rejects a duplicate email with conflict" do
    create(:user, email: "ada@example.com")
    result = described_class.call(email: "ada@example.com", name: "Ada", password: "password12", password_confirmation: "password12")

    expect(result.error_code).to eq(:conflict)
  end

  it "rejects a short password using the Settings minimum" do
    result = described_class.call(email: "a@x.com", name: "Ada", password: "short", password_confirmation: "short")

    expect(result.error_code).to eq(:validation_failed)
    expect(result.error_details[:password]).to be_present
  end

  it "rejects a confirmation mismatch" do
    result = described_class.call(email: "a@x.com", name: "Ada", password: "password12", password_confirmation: "otherpass")

    expect(result.error_details[:password_confirmation]).to be_present
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(email: "a@x.com", name: "Ada", password: "password12", password_confirmation: "password12").error_code).to eq(:not_found)
  end
end
