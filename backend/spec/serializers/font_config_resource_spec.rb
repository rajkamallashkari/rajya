require "rails_helper"

RSpec.describe FontConfigResource do
  it "serializes catalogue fields including a Google Fonts URL" do
    font = create(:font_config, name: "Inter", google_font_url: "https://fonts.googleapis.com/css2?family=Inter",
                                position: 1)
    expect(described_class.new(font).to_h).to include(
      "id" => font.id,
      "name" => "Inter",
      "font_family_value" => "Inter, sans-serif",
      "google_font_url" => "https://fonts.googleapis.com/css2?family=Inter",
      "position" => 1
    )
  end
end
