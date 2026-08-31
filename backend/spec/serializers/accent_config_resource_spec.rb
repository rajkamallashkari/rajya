require "rails_helper"

RSpec.describe AccentConfigResource do
  it "serializes catalogue fields" do
    accent = create(:global_accent_config, id: "cyber_indigo", label: "Cyber indigo",
                                           hex: "#4F46E5", is_dark_compatible: false, position: 2)
    expect(described_class.new(accent).to_h).to include(
      "id" => "cyber_indigo", "hex" => "#4F46E5", "is_dark_compatible" => false, "position" => 2
    )
  end
end
