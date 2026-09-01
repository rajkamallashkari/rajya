require "rails_helper"

RSpec.describe ThemeOverridePolicy do
  it "allows authenticated humans to load the merged palette" do
    user = create(:user)

    expect(described_class.new(user.account, :theme_override)).to be_show
    expect(described_class.new(nil, :theme_override)).not_to be_show
  end

  it "resolves all overrides" do
    override = create(:theme_override)
    scope = described_class::Scope.new(create(:account), ThemeOverride.all)

    expect(scope.resolve).to contain_exactly(override)
  end
end
