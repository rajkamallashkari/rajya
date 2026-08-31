require "rails_helper"

RSpec.describe FontConfigPolicy do
  it "allows an authenticated account to list fonts" do
    expect(described_class.new(create(:user).account, FontConfig)).to be_index
    expect(described_class.new(nil, FontConfig)).not_to be_index
  end

  it "scopes to active fonts and hides inactive ones" do
    user = create(:user)
    active = create(:font_config, name: "Live")
    create(:font_config, name: "Hidden", is_active: false)
    expect(described_class::Scope.new(user.account, FontConfig.all).resolve).to contain_exactly(active)
    expect(described_class::Scope.new(nil, FontConfig.all).resolve).to be_empty
  end
end
