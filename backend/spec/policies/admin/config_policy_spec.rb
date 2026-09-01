require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- one file for the four admin config policies
RSpec.describe Admin::AppSettingPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :app_setting)).to be_index.and be_update.and be_destroy
    expect(described_class.new(create(:user), :app_setting)).not_to be_update
  end
end

RSpec.describe Admin::FeatureFlagPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :feature_flag)).to be_index.and be_update
    expect(described_class.new(create(:user), :feature_flag)).not_to be_update
  end
end

RSpec.describe Admin::TranslationStringPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :translation_string)).to be_index.and be_update.and be_destroy
    expect(described_class.new(create(:user), :translation_string)).not_to be_update
  end
end

RSpec.describe Admin::ThemeOverridePolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :theme_override)).to be_index.and be_update.and be_destroy
    expect(described_class.new(create(:user), :theme_override)).not_to be_update
  end
end

RSpec.describe ThemeOverridePolicy do
  it "allows an authenticated human to read palettes" do
    expect(described_class.new(create(:user).account, ThemeOverride)).to be_show
    expect(described_class.new(nil, ThemeOverride)).not_to be_show
  end
end
# rubocop:enable RSpec/MultipleDescribes
