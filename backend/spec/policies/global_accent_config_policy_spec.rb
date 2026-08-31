require "rails_helper"

RSpec.describe GlobalAccentConfigPolicy do
  it "allows an authenticated account to list accents" do
    expect(described_class.new(create(:user).account, GlobalAccentConfig)).to be_index
    expect(described_class.new(nil, GlobalAccentConfig)).not_to be_index
  end

  it "scopes to active accents and hides inactive ones" do
    user = create(:user)
    active = create(:global_accent_config, id: "live", label: "Live")
    create(:global_accent_config, id: "hidden", label: "Hidden", is_active: false)
    expect(described_class::Scope.new(user.account, GlobalAccentConfig.all).resolve).to contain_exactly(active)
    expect(described_class::Scope.new(nil, GlobalAccentConfig.all).resolve).to be_empty
  end
end
