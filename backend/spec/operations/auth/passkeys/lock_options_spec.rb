require "rails_helper"

RSpec.describe Auth::Passkeys::LockOptions do
  def disable_flag!
    create(:feature_flag, key: "app_lock",
                          description: FeatureFlagRegistry.description_for(:app_lock), enabled: false)
  end

  it "returns assertion options with userVerification required" do
    user = create(:user)
    result = described_class.call(user: user)
    verification = result.value[:userVerification] || result.value["userVerification"]

    expect(result).to be_success
    expect(verification).to eq("required")
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(user: create(:user)).error_code).to eq(:not_found)
  end
end
