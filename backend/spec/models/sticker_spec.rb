require "rails_helper"

RSpec.describe Sticker do
  it "rejects a blank or invalid shortcode and an overlong one" do
    expect(build(:sticker, shortcode: "")).not_to be_valid
    expect(build(:sticker, shortcode: "Wave!")).not_to be_valid
    stub_setting(:sticker_shortcode_max_length, 2, category: "media")
    expect(build(:sticker, shortcode: "toolong")).not_to be_valid
  end

  it "parses a reaction token from a persisted sticker" do
    sticker = create(:sticker)
    expect(sticker.reaction_token).to eq(":#{sticker.id}:")
    expect(described_class.id_from_reaction_token(sticker.reaction_token)).to eq(sticker.id)
    expect(described_class.id_from_reaction_token("👍")).to be_nil
  end
end
