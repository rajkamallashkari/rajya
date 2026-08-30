require "rails_helper"

RSpec.describe ExportJobs::PurgeExpired do
  it "releases quota and purges the blob for an expired artefact" do
    user = create(:user)
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("body"), filename: "e.json")
    job = create(:export_job, account: user.account, status: "ready", blob: blob, expires_at: 1.minute.ago)
    StorageQuota.ensure_for!(user.account).update!(used_bytes: blob.byte_size)

    described_class.call

    expect(job.reload).to have_attributes(status: "failed", error_message: "expired", blob_id: nil)
    expect(ActiveStorage::Blob.where(id: blob.id)).not_to exist
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(0)
  end

  it "expires a pending job that never produced a blob" do
    job = create(:export_job, expires_at: 1.minute.ago)

    described_class.call

    expect(job.reload).to have_attributes(status: "failed", error_message: "expired")
  end
end
