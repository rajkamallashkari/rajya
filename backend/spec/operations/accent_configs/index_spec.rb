require "rails_helper"

RSpec.describe AccentConfigs::Index do
  it "orders active accents by position then id" do
    account = create(:user).account
    later = create(:global_accent_config, id: "zeta", label: "Zeta", position: 1)
    earlier = create(:global_accent_config, id: "alpha", label: "Alpha", position: 0)
    result = described_class.call(account: account, accents: GlobalAccentConfig.all)

    expect(result.value.accent_configs).to eq([ earlier, later ])
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, accents: GlobalAccentConfig.all).error_code).to eq(:forbidden)
  end
end
