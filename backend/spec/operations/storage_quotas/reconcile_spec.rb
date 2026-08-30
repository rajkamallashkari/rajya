require "rails_helper"

RSpec.describe StorageQuotas::Reconcile do
  it "repairs a drifted per-account counter from unique owned blobs (F-5)" do
    user = create(:user)
    peer = create(:account)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    original = create(:attachment, message: create(:message, sender_account: user.account))
    original.file.attach(blob)
    copy = create(:attachment, message: create(:message, sender_account: peer))
    copy.file.attach(blob)
    quota = create(:storage_quota, account: user.account, used_bytes: 99)

    described_class.call(account: user.account)

    expect(quota.reload.used_bytes).to eq(blob.byte_size)
    expect(quota.recomputed_at).to be_present
  end

  it "attributes user-pack sticker blobs to the owner and not to a later sender" do
    owner = create(:user)
    sender = create(:user)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    pack = create(:sticker_pack, owner_account: owner.account)
    create(:sticker, sticker_pack: pack, blob: blob)
    copy = create(:attachment, message: create(:message, sender_account: sender.account))
    copy.file.attach(blob)
    create(:storage_quota, account: owner.account, used_bytes: 0)
    create(:storage_quota, account: sender.account, used_bytes: 99)

    described_class.call

    expect(StorageQuota.find(owner.account.id).used_bytes).to eq(blob.byte_size)
    expect(StorageQuota.find(sender.account.id).used_bytes).to eq(0)
  end

  it "repairs bucket used_bytes without double-counting shared blobs" do
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 50)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    blob.update_column(:service_name, "test")
    first = create(:attachment)
    first.file.attach(blob)
    copy = create(:attachment)
    copy.file.attach(blob)

    described_class.call

    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "records zero usage when the account owns no blobs" do
    account = create(:account)

    described_class.call(account: account)

    expect(StorageQuota.find(account.id).used_bytes).to eq(0)
  end

  it "marks an overflowing active bucket full and reopens a repaired full bucket" do
    overflowing = create(:storage_bucket, service_name: "test", used_bytes: 0, capacity_bytes: 1, status: "active")
    reopened = create(:storage_bucket, service_name: "test_secondary", used_bytes: 9, capacity_bytes: 10, status: "full")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("abcd"), filename: "a.bin")
    blob.update_column(:service_name, "test")
    create(:attachment).file.attach(blob)

    described_class.call

    expect(overflowing.reload.status).to eq("full")
    expect(reopened.reload.status).to eq("active")
  end

  it "counts sticker blobs toward bucket usage" do
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png")
    blob.update_column(:service_name, "test")
    create(:sticker, blob: blob)

    described_class.call

    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "leaves a failed bucket's status unchanged" do
    bucket = create(:storage_bucket, service_name: "test", status: "failed", used_bytes: 0, capacity_bytes: 10)

    described_class.call

    expect(bucket.reload.status).to eq("failed")
  end
end
