require "rails_helper"

RSpec.describe PhoneVerifications::Issue do
  def disable_flag!
    create(:feature_flag, key: "phone_auth", description: FeatureFlagRegistry.description_for(:phone_auth),
                          enabled: false)
  end

  it "issues a pending code and a wa.me URL" do
    configure_whatsapp!
    user = create(:user)
    result = described_class.call(user: user)

    expect(result).to be_success
    expect(result.value).to have_attributes(status: "pending", wa_url: a_string_including("wa.me"))
    expect(result.value.code).to match(/\A\d{6}\z/)
    expect(user.phone_verification_requests.pending.count).to eq(1)
  end

  it "expires a previous pending request" do
    user = create(:user)
    old = create(:phone_verification_request, user: user, expires_at: 1.hour.from_now)
    described_class.call(user: user)

    expect(old.reload).to be_expired
  end

  it "regenerates when the digest is already pending" do
    digest = PhoneVerificationRequest.digest("111111")
    create(:phone_verification_request, code_digest: digest, expires_at: 1.hour.from_now)
    allow(Auth::Codes).to receive(:generate_otp).and_return("111111", "222222")

    result = described_class.call(user: create(:user))
    expect(result.value.code).to eq("222222")
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!
    expect(described_class.call(user: create(:user)).error_code).to eq(:not_found)
  end
end
