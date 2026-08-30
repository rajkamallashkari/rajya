require "rails_helper"

RSpec.describe StickerPackResource do
  it "nests stickers ordered by position" do
    pack = create(:sticker_pack, name: "Waves")
    later = create(:sticker, sticker_pack: pack, shortcode: "b", position: 1)
    earlier = create(:sticker, sticker_pack: pack, shortcode: "a", position: 0)
    json = described_class.new(pack).to_h

    expect(json).to include("name" => "Waves", "kind" => "sticker")
    expect(json.fetch("stickers").map { |row| row.fetch("id") }).to eq([ earlier.id, later.id ])
  end
end
