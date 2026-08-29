require "rails_helper"

RSpec.describe Auth::Passkeys::Rename do
  def disable_flag!
    create(:feature_flag, key: "passkey_auth",
                          description: FeatureFlagRegistry.description_for(:passkey_auth), enabled: false)
  end

  it "updates the nickname" do
    passkey = create(:passkey, nickname: "Old")
    result = described_class.call(passkey: passkey, nickname: "  Pocket  ")

    expect(result).to be_success
    expect(passkey.reload.nickname).to eq("Pocket")
  end

  it "rejects a blank nickname" do
    passkey = create(:passkey)
    result = described_class.call(passkey: passkey, nickname: " ")

    expect(result.error_code).to eq(:validation_failed)
  end

  it "hides the endpoint when the flag is off" do
    disable_flag!

    expect(described_class.call(passkey: create(:passkey), nickname: "X").error_code).to eq(:not_found)
  end
end
