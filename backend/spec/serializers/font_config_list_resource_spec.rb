require "rails_helper"

RSpec.describe FontConfigListResource do
  it "wraps fonts" do
    font = create(:font_config, name: "Inter")
    json = described_class.new(FontConfigs::List.new(font_configs: [ font ])).to_h

    expect(json.fetch("font_configs").sole).to include(
      "id" => font.id, "name" => "Inter", "font_family_value" => font.font_family_value
    )
  end
end
