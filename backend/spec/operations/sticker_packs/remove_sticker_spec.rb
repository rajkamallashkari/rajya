require "rails_helper"

RSpec.describe StickerPacks::RemoveSticker do
  it "removes the row and releases quota when the blob is unused" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    create(:storage_bucket, service_name: "test")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    sticker = StickerPacks::AddSticker.call(
      pack: pack, actor: user.account, signed_id: blob.signed_id, shortcode: "wave"
    ).value

    result = described_class.call(sticker: sticker, actor: user.account)

    expect(result).to be_success
    expect(Sticker.where(id: sticker.id)).not_to exist
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(0)
  end

  it "rejects a stranger" do
    sticker = create(:sticker)
    expect(described_class.call(sticker: sticker, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
