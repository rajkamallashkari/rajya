require "rails_helper"

RSpec.describe StickerPacks::Index do
  it "orders visible packs by position then id" do
    account = create(:user).account
    later = create(:sticker_pack, owner_account: account, position: 1)
    earlier = create(:sticker_pack, owner_account: account, position: 0)
    result = described_class.call(account: account, packs: StickerPack.all)

    expect(result.value.sticker_packs).to eq([ earlier, later ])
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, packs: StickerPack.all).error_code).to eq(:forbidden)
  end
end
