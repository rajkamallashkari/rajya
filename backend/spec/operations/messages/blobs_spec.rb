require "rails_helper"

RSpec.describe Messages::Blobs do
  it "parses a JSON waveform string and copies an attachment without a blob" do
    peaks = described_class.normalize_waveform("[0.2, 0.8]")
    source = create(:message)
    target = create(:message)
    create(:attachment, message: source)
    described_class.copy!(source, target)

    expect(peaks).to eq([ 0.2, 0.8 ])
    expect(target.attachments.count).to eq(1)
    expect(target.attachments.first.file).not_to be_attached
  end

  it "returns nil for a blank or invalid waveform" do
    expect(described_class.normalize_waveform(nil)).to be_nil
    expect(described_class.normalize_waveform("{")).to be_nil
    expect(described_class.normalize_waveform("{\"a\":1}")).to be_nil
  end

  it "binds the storage bucket and charges quota on attach" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    bucket = create(:storage_bucket, service_name: "test")
    allow(Attachments::ProcessJob).to receive(:perform_later)

    described_class.attach!(message, signed_ids: [ blob_signed_id, "bad" ])

    attachment = message.attachments.first
    expect(attachment.storage_bucket_id).to eq(bucket.id)
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(attachment.byte_size)
    expect(Attachments::ProcessJob).to have_received(:perform_later).with(attachment.id)
  end

  it "leaves storage_bucket unset when no matching bucket exists" do
    message = create(:message)
    allow(Attachments::ProcessJob).to receive(:perform_later)

    described_class.attach!(message, signed_ids: [ blob_signed_id ])

    expect(message.attachments.first.storage_bucket_id).to be_nil
  end

  it "copies an attached blob onto the target message" do
    source = create(:message)
    target = create(:message)
    original = create(:attachment, message: source)
    original.file.attach(io: StringIO.new("img"), filename: "a.png", content_type: "image/png")

    described_class.copy!(source, target)

    expect(target.attachments.first.file.blob).to eq(original.file.blob)
  end
end
