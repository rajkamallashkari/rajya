require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- quota accounting assertions
RSpec.describe StickerPacks::Destroy do
  it "destroys the pack and releases the owner's quota" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    StickerPacks::AddSticker.call(pack: pack, actor: user.account, signed_id: blob.signed_id, shortcode: "wave")

    result = described_class.call(pack: pack, actor: user.account)

    expect(result).to be_success
    expect(StickerPack.where(id: pack.id)).not_to exist
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(0)
    expect(bucket.reload.used_bytes).to eq(0)
  end

  it "rejects a stranger" do
    pack = create(:sticker_pack)
    expect(described_class.call(pack: pack, actor: create(:user).account).error_code).to eq(:forbidden)
  end

  it "lets an admin destroy a system pack without charging a user quota (S-19)" do
    admin = create(:user, :admin)
    bystander = create(:user)
    StorageQuota.ensure_for!(admin.account)
    StorageQuota.ensure_for!(bystander.account)
    pack = create(:sticker_pack, :system)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    StickerPacks::AddSticker.call(pack: pack, actor: admin.account, signed_id: blob.signed_id, shortcode: "wave")

    result = described_class.call(pack: pack, actor: admin.account)

    expect(result).to be_success
    expect(StickerPack.where(id: pack.id)).not_to exist
    expect(StorageQuota.find(admin.account.id).used_bytes).to eq(0)
    expect(StorageQuota.find(bystander.account.id).used_bytes).to eq(0)
    expect(bucket.reload.used_bytes).to eq(0)
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
