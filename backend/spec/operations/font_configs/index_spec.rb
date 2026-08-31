require "rails_helper"

RSpec.describe FontConfigs::Index do
  it "orders active fonts by position then id" do
    account = create(:user).account
    later = create(:font_config, name: "Zed", position: 1)
    earlier = create(:font_config, name: "Ada", position: 0)
    result = described_class.call(account: account, fonts: FontConfig.all)

    expect(result.value.font_configs).to eq([ earlier, later ])
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, fonts: FontConfig.all).error_code).to eq(:forbidden)
  end
end
