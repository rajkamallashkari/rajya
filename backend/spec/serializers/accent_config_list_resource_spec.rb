require "rails_helper"

RSpec.describe AccentConfigListResource do
  it "wraps accents" do
    accent = create(:global_accent_config, id: "cyber_indigo", label: "Cyber indigo", hex: "#4F46E5")
    json = described_class.new(AccentConfigs::List.new(accent_configs: [ accent ])).to_h

    expect(json.fetch("accent_configs").sole).to include(
      "id" => "cyber_indigo", "label" => "Cyber indigo", "hex" => "#4F46E5",
      "is_light_compatible" => true, "is_dark_compatible" => true
    )
  end
end
