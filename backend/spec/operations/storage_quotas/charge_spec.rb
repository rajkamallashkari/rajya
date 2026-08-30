require "rails_helper"

RSpec.describe StorageQuotas::Charge do
  it "increments the account quota and bucket on the first use of a blob" do
    user = create(:user)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    attachment = create(:attachment, message: create(:message, sender_account: user.account))
    attachment.file.attach(blob)

    described_class.call(account: user.account, blob: blob, bucket: bucket)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(blob.byte_size)
    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "does not double-count a blob shared by a forward (BR-11)" do
    user = create(:user)
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    first = create(:attachment, message: create(:message, sender_account: user.account))
    first.file.attach(blob)
    described_class.call(account: user.account, blob: blob, bucket: bucket)
    copy = create(:attachment, message: create(:message, sender_account: create(:account)))
    copy.file.attach(blob)
    described_class.call(account: copy.message.sender_account, blob: blob, bucket: bucket)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(blob.byte_size)
    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end

  it "increments quota without a bucket when routing has not bound one" do
    user = create(:user)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    attachment = create(:attachment, message: create(:message, sender_account: user.account))
    attachment.file.attach(blob)

    described_class.call(account: user.account, blob: blob)

    expect(StorageQuota.find(user.account.id).used_bytes).to eq(blob.byte_size)
  end

  it "charges only the bucket when the pack has no owner (S-19)" do
    bucket = create(:storage_bucket, service_name: "test", used_bytes: 0)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "a.png")
    create(:sticker, blob: blob)

    described_class.call(account: nil, blob: blob, bucket: bucket)

    expect(bucket.reload.used_bytes).to eq(blob.byte_size)
  end
end
