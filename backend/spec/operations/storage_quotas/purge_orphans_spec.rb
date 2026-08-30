require "rails_helper"

RSpec.describe StorageQuotas::PurgeOrphans do
  it "purges unattached blobs older than the orphan threshold (BR-95)" do
    old = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("old"), filename: "old.bin")
    old.update_column(:created_at, 2.hours.ago)
    kept = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("new"), filename: "new.bin")
    attached = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("used"), filename: "used.bin")
    create(:attachment).file.attach(attached)

    expect(described_class.call.value).to eq(1)
    expect(ActiveStorage::Blob.exists?(old.id)).to be(false)
    expect(ActiveStorage::Blob.exists?(kept.id)).to be(true)
    expect(ActiveStorage::Blob.exists?(attached.id)).to be(true)
  end

  it "does not purge link-preview keys (BR-95)" do
    preview = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("og"), filename: "og.png")
    preview.update_columns(created_at: 2.hours.ago, key: "#{Settings.fetch(:link_preview_blob_prefix)}x")

    described_class.call
    expect(ActiveStorage::Blob.exists?(preview.id)).to be(true)
  end
end
