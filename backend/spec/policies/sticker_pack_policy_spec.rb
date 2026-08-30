require "rails_helper"

RSpec.describe StickerPackPolicy do
  it "allows a human to list and create packs" do
    user = create(:user)
    expect(described_class.new(user.account, StickerPack)).to be_index.and be_create
    expect(described_class.new(create(:bot).account, StickerPack)).not_to be_create
  end

  it "allows the owner to update, destroy, and add stickers" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    policy = described_class.new(user.account, pack)
    expect(policy).to be_update.and be_destroy.and be_add_sticker.and be_show
    expect(described_class.new(nil, pack)).not_to be_update
  end

  it "hides unpublished packs from strangers and scopes published plus owned" do
    user = create(:user)
    mine = create(:sticker_pack, owner_account: user.account)
    published = create(:sticker_pack, :published)
    create(:sticker_pack)
    expect(described_class.new(user.account, published)).to be_show
    expect(described_class.new(user.account, create(:sticker_pack))).not_to be_show
    expect(described_class.new(user.account, StickerPack)).not_to be_update
    expect(described_class::Scope.new(user.account, StickerPack.all).resolve).to contain_exactly(mine, published)
  end

  it "returns no packs for an anonymous scope" do
    create(:sticker_pack, :published)
    expect(described_class::Scope.new(nil, StickerPack.all).resolve).to be_empty
  end
end
