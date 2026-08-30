require "rails_helper"

RSpec.describe StickerPacks::AddSticker do
  def add(pack, actor, blob: nil, shortcode: "wave")
    blob ||= ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new("img"), filename: "s.png", content_type: "image/png"
    )
    described_class.call(pack: pack, actor: actor, signed_id: blob.signed_id, shortcode: shortcode)
  end

  it "charges the owner quota and the bucket for a user pack (S-19)" do
    user = create(:user)
    other = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")

    result = add(pack, user.account, blob: blob)

    expect(result).to be_success
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(blob.byte_size)
    expect(StorageQuota.ensure_for!(other.account).used_bytes).to eq(0)
    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "charges the global bucket and not any user quota for a system pack (S-19)" do
    admin = create(:user, :admin)
    bystander = create(:user)
    StorageQuota.ensure_for!(admin.account)
    StorageQuota.ensure_for!(bystander.account)
    pack = create(:sticker_pack, :system)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")

    result = add(pack, admin.account, blob: blob)

    expect(result).to be_success
    expect(StorageQuota.find(admin.account.id).used_bytes).to eq(0)
    expect(StorageQuota.find(bystander.account.id).used_bytes).to eq(0)
    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "rejects a non-image, a stranger, a bad signed id, and a full pack" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    file = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("x"), filename: "a.bin", content_type: "application/zip")

    expect(add(pack, user.account, blob: file).error_code).to eq(:validation_failed)
    expect(add(pack, create(:user).account).error_code).to eq(:forbidden)
    expect(described_class.call(pack: pack, actor: user.account, signed_id: "nope", shortcode: "x").error_code)
      .to eq(:not_found)
    stub_setting(:sticker_pack_max_items, 1, category: "media")
    add(pack, user.account, shortcode: "one")
    expect(add(pack, user.account, shortcode: "two").error_code).to eq(:validation_failed)
  end

  it "rejects when the pack byte cap or owner sticker pool is exhausted" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    create(:storage_bucket, service_name: "test")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    stub_setting(:sticker_pack_max_bytes, blob.byte_size - 1, category: "media")
    expect(add(pack, user.account, blob: blob).error_code).to eq(:quota_exceeded)
  end

  it "rejects when the owner sticker pool is exhausted" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    create(:storage_bucket, service_name: "test")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    stub_setting(:sticker_storage_max_bytes, blob.byte_size - 1, category: "media")
    expect(add(pack, user.account, blob: blob).error_code).to eq(:quota_exceeded)
  end

  it "rejects when the account storage quota cannot fit a first-use blob" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    create(:storage_bucket, service_name: "test")
    create(:storage_quota, account: user.account, quota_bytes: 1, used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    expect(add(pack, user.account, blob: blob).error_code).to eq(:quota_exceeded)
  end

  it "rejects a duplicate shortcode" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    add(pack, user.account, shortcode: "wave")
    expect(add(pack, user.account, shortcode: "wave").error_code).to eq(:validation_failed)
  end

  it "lets an admin add to a system pack and rejects a non-admin" do
    pack = create(:sticker_pack, :system)
    expect(add(pack, create(:user).account).error_code).to eq(:forbidden)
    expect(add(pack, create(:user, :admin).account)).to be_success
  end

  it "rejects a missing actor, a bot on a system pack, and a full global bucket" do
    pack = create(:sticker_pack)
    expect(described_class.call(pack: pack, actor: nil, signed_id: "x", shortcode: "x").error_code).to eq(:forbidden)
    expect(add(create(:sticker_pack, :system), create(:bot).account).error_code).to eq(:forbidden)
    user = create(:user)
    owned = create(:sticker_pack, owner_account: user.account)
    create(:storage_bucket, service_name: "test")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    stub_setting(:global_quota_bytes, blob.byte_size - 1)
    expect(add(owned, user.account, blob: blob).error_code).to eq(:quota_exceeded)
  end
end
