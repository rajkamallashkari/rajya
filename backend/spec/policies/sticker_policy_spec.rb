require "rails_helper"

RSpec.describe StickerPolicy do
  it "allows the pack owner to destroy a sticker" do
    user = create(:user)
    sticker = create(:sticker, sticker_pack: create(:sticker_pack, owner_account: user.account))
    expect(described_class.new(user.account, sticker)).to be_destroy
    expect(described_class.new(create(:user).account, sticker)).not_to be_destroy
    expect(described_class.new(user.account, Sticker)).not_to be_destroy
    expect(described_class.new(nil, sticker)).not_to be_destroy
  end

  it "scopes to published packs and the owner's unpublished stickers" do
    user = create(:user)
    mine = create(:sticker, sticker_pack: create(:sticker_pack, owner_account: user.account))
    published = create(:sticker, sticker_pack: create(:sticker_pack, :published))
    create(:sticker)
    expect(described_class::Scope.new(user.account, Sticker.all).resolve).to contain_exactly(mine, published)
    expect(described_class::Scope.new(nil, Sticker.all).resolve).to be_empty
  end
end
