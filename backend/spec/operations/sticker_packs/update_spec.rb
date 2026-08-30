require "rails_helper"

RSpec.describe StickerPacks::Update do
  it "renames, repositions, and publishes a pack" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account, name: "Old")
    result = described_class.call(pack: pack, actor: user.account, name: "New", position: 3, published: true)

    expect(result.value).to have_attributes(name: "New", position: 3)
    expect(result.value.published_at).to be_present
    described_class.call(pack: pack, actor: user.account, published: false)
    expect(pack.reload.published_at).to be_nil
  end

  it "rejects a stranger" do
    pack = create(:sticker_pack)
    expect(described_class.call(pack: pack, actor: create(:user).account, name: "X").error_code).to eq(:forbidden)
  end

  it "rejects an overlong name" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    stub_setting(:sticker_pack_name_max_length, 1, category: "media")
    expect(described_class.call(pack: pack, actor: user.account, name: "ab").error_code).to eq(:validation_failed)
  end
end
