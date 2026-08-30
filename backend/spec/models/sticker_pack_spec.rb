require "rails_helper"

RSpec.describe StickerPack do
  it "rejects an invalid kind, slug, and overlong name" do
    expect(build(:sticker_pack, kind: "nope")).not_to be_valid
    expect(build(:sticker_pack, slug: "Not Valid")).not_to be_valid
    stub_setting(:sticker_pack_name_max_length, 2, category: "media")
    expect(build(:sticker_pack, name: "too")).not_to be_valid
    stub_setting(:sticker_pack_slug_max_length, 2, category: "media")
    expect(build(:sticker_pack, slug: "abc")).not_to be_valid
  end

  it "skips length and format checks when name or slug is blank" do
    expect(build(:sticker_pack, name: "")).not_to be_valid
    expect(build(:sticker_pack, slug: "")).not_to be_valid
  end

  it "treats a null owner as a system pack and published_at as published" do
    pack = build(:sticker_pack, :system, published_at: Time.current)
    expect(pack).to be_system
    expect(pack).to be_published
    expect(pack).to be_visible_to(create(:account))
  end

  it "hides an unpublished user pack from strangers" do
    pack = create(:sticker_pack)
    expect(pack).to be_visible_to(pack.owner_account)
    expect(pack).not_to be_visible_to(create(:account))
    expect(pack).not_to be_visible_to(nil)
  end
end
