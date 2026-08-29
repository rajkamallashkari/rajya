require "rails_helper"

RSpec.describe PhoneVerifications::Show do
  def disable_flag!
    create(:feature_flag, key: "phone_auth", description: FeatureFlagRegistry.description_for(:phone_auth),
                          enabled: false)
  end

  it "returns none when the user has no requests" do
    user = create(:user, phone: "1555")
    result = described_class.call(user: user)

    expect(result.value.status).to eq("none")
    expect(result.value.confirmed_phone).to eq("1555")
    expect(result.value.code).to be_nil
  end

  it "reports pending, confirmed, and expired" do
    user = create(:user)
    create(:phone_verification_request, user: user, expires_at: 1.hour.from_now)
    expect(described_class.call(user: user).value.status).to eq("pending")

    user.phone_verification_requests.delete_all
    create(:phone_verification_request, user: user, confirmed_at: Time.current, confirmed_phone: "1")
    expect(described_class.call(user: user).value.status).to eq("confirmed")

    user.phone_verification_requests.delete_all
    create(:phone_verification_request, user: user, expires_at: 1.minute.ago)
    expect(described_class.call(user: user).value.status).to eq("expired")
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!
    expect(described_class.call(user: create(:user)).error_code).to eq(:not_found)
  end
end
