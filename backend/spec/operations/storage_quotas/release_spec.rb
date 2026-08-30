require "rails_helper"

RSpec.describe StorageQuotas::Release do
  it "decrements quota and bucket when the blob has no remaining attachments" do
    user = create(:user)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 3)
    create(:storage_quota, account: user.account, used_bytes: 3)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")

    described_class.call(account: user.account, blob: blob, bucket: bucket)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(0)
    expect(bucket.reload.used_bytes).to eq(0)
  end

  it "leaves counters unchanged while the blob is still attached" do
    user = create(:user)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 3)
    create(:storage_quota, account: user.account, used_bytes: 3)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    attachment = create(:attachment)
    attachment.file.attach(blob)

    described_class.call(account: user.account, blob: blob, bucket: bucket)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(3)
    expect(bucket.reload.used_bytes).to eq(3)
  end

  it "decrements quota without a bucket when routing has not bound one" do
    user = create(:user)
    create(:storage_quota, account: user.account, used_bytes: 3)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")

    described_class.call(account: user.account, blob: blob)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(0)
  end

  it "does not decrement while a sticker still references the blob" do
    user = create(:user)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 3)
    create(:storage_quota, account: user.account, used_bytes: 3)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    create(:sticker, blob: blob)

    described_class.call(account: user.account, blob: blob, bucket: bucket)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(3)
    expect(bucket.reload.used_bytes).to eq(3)
  end

  it "skips the account ledger when releasing a system-owned blob" do
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 3)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")

    described_class.call(account: nil, blob: blob, bucket: bucket)

    expect(bucket.reload.used_bytes).to eq(0)
  end
end
