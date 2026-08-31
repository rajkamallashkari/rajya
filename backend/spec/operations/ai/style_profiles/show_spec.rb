require "rails_helper"

RSpec.describe Ai::StyleProfiles::Show do
  it "returns disabled with a null blob by default (F-11)" do
    account = create(:user).account
    result = described_class.call(account: account).value

    expect(result.enabled).to be(false)
    expect(result.profile).to be_nil
  end

  it "exposes the stored global blob and message count" do
    account = create(:user).account
    preference = account.create_preference!(data: {})
    preference.merge_ai!(
      "style_profile_enabled" => true,
      "style_profile" => { "global" => "Warm", "message_count_at_generation" => 12 },
      "style_profile_updated_at" => "2026-08-31T00:00:00Z"
    )

    result = described_class.call(account: account).value
    expect(result).to have_attributes(enabled: true, profile: "Warm", message_count: 12)
  end
end
