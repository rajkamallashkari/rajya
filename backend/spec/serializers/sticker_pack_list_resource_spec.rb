require "rails_helper"

RSpec.describe StickerPackListResource do
  it "wraps packs" do
    pack = create(:sticker_pack)
    json = described_class.new(StickerPacks::List.new(sticker_packs: [ pack ])).to_h

    expect(json.fetch("sticker_packs").sole.fetch("id")).to eq(pack.id)
  end
end
