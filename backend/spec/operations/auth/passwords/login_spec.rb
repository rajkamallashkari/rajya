require "rails_helper"

RSpec.describe Auth::Passwords::Login do
  def disable_flag!
    create(:feature_flag, key: "email_password_auth",
                          description: FeatureFlagRegistry.description_for(:email_password_auth), enabled: false)
  end

  it "returns a session for a matching email and password" do
    user = create(:user, :with_password, email: "ada@example.com")
    result = described_class.call(email: "ADA@example.com", password: "password12")

    expect(result).to be_success
    expect(result.value.user).to eq(user)
  end

  it "returns unauthenticated for an unknown email after dummy bcrypt (F-24)" do
    allow(Auth::Codes).to receive(:dummy_match).and_call_original

    result = described_class.call(email: "missing@example.com", password: "password12")

    expect(result.error_code).to eq(:unauthenticated)
    expect(Auth::Codes).to have_received(:dummy_match)
  end

  it "returns unauthenticated for a wrong password" do
    create(:user, :with_password, email: "ada@example.com")

    expect(described_class.call(email: "ada@example.com", password: "wrongpass").error_code).to eq(:unauthenticated)
  end

  it "returns unauthenticated when the user has no password" do
    create(:user, :google, email: "g@example.com")

    expect(described_class.call(email: "g@example.com", password: "password12").error_code).to eq(:unauthenticated)
  end

  it "returns unauthenticated for a deactivated account" do
    user = create(:user, :with_password)
    user.account.update!(deactivated_at: Time.current)

    expect(described_class.call(email: user.email, password: "password12").error_code).to eq(:unauthenticated)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(email: "a@x.com", password: "password12").error_code).to eq(:not_found)
  end
end
