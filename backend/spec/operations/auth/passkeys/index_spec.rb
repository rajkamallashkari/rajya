require "rails_helper"

RSpec.describe Auth::Passkeys::Index do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "returns passkeys in creation order" do
    user = create(:user)
    older = create(:passkey, user: user, nickname: "A", created_at: 2.days.ago)
    newer = create(:passkey, user: user, nickname: "B", created_at: 1.day.ago)
    result = described_class.call(passkeys: user.passkeys)

    expect(result.value.passkeys).to eq([ older, newer ])
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(passkeys: Passkey.all).error_code).to eq(:not_found)
  end
end
