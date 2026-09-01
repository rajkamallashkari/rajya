require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- Alba snapshots for the config editors
RSpec.describe AdminSettingListResource do
  it "serializes settings and unregistered keys" do
    json = described_class.new(Admin::Settings::List.new(settings: [ { "key" => "a" } ], unregistered_keys: [ "x" ])).to_h

    expect(json.fetch("settings")).to eq([ { "key" => "a" } ])
    expect(json.fetch("unregistered_keys")).to eq([ "x" ])
  end
end

RSpec.describe AdminSettingResource do
  it "serializes one setting" do
    json = described_class.new(Admin::Settings::Item.new(setting: { "key" => "a" })).to_h

    expect(json.fetch("setting").fetch("key")).to eq("a")
  end
end

RSpec.describe AdminFeatureFlagResource do
  it "serializes one flag" do
    json = described_class.new(Admin::FeatureFlags::Item.new(feature_flag: { "key" => "a" })).to_h

    expect(json.fetch("feature_flag").fetch("key")).to eq("a")
  end
end

RSpec.describe AdminFeatureFlagListResource do
  it "serializes flags" do
    json = described_class.new(
      Admin::FeatureFlags::List.new(feature_flags: [ { "key" => "webrtc_calls" } ], unregistered_keys: [])
    ).to_h

    expect(json.fetch("feature_flags").first.fetch("key")).to eq("webrtc_calls")
  end
end

RSpec.describe AdminTranslationStringResource do
  it "serializes one string" do
    json = described_class.new(Admin::TranslationStrings::Item.new(translation_string: { "key" => "a" })).to_h

    expect(json.fetch("translation_string").fetch("key")).to eq("a")
  end
end

RSpec.describe AdminTranslationStringListResource do
  it "serializes strings" do
    json = described_class.new(Admin::TranslationStrings::List.new(translation_strings: [ { "key" => "a" } ])).to_h

    expect(json.fetch("translation_strings").first.fetch("key")).to eq("a")
  end
end

RSpec.describe AdminThemeOverrideResource do
  it "serializes one override" do
    json = described_class.new(Admin::ThemeOverrides::Item.new(override: { "token_name" => "--accent" })).to_h

    expect(json.fetch("override").fetch("token_name")).to eq("--accent")
  end
end

RSpec.describe AdminThemeOverrideListResource do
  it "serializes themes" do
    json = described_class.new(Admin::ThemeOverrides::List.new(themes: { "light" => [] })).to_h

    expect(json.fetch("themes")).to have_key("light")
  end
end

RSpec.describe ThemeOverridePaletteResource do
  it "serializes light and dark maps" do
    json = described_class.new(ThemeOverrides::View.new(light: { "--accent" => "#4F46E5" }, dark: {})).to_h

    expect(json.fetch("light")).to eq("--accent" => "#4F46E5")
    expect(json.fetch("dark")).to eq({})
  end
end
# rubocop:enable RSpec/MultipleDescribes
