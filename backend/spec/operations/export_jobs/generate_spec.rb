require "rails_helper"

RSpec.describe ExportJobs::Generate do
  it "builds a JSON artefact, charges quota, and marks the job ready (NR-32)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    create(:message, conversation: conversation, sender_account: user.account, body: "Hi")
    job = create(:export_job, account: user.account, conversation: conversation)

    described_class.call(job: job)

    job.reload
    expect(job).to be_ready
    expect(job.blob).to be_present
    expect(job.blob.download).to include("Hi")
    expect(StorageQuota.find(user.account.id).used_bytes).to eq(job.blob.byte_size)
  end

  it "fails visibly when the requester is out of quota" do
    user = create(:user)
    StorageQuota.ensure_for!(user.account).update!(used_bytes: Settings.fetch(:user_quota_bytes))
    job = create(:export_job, account: user.account)

    described_class.call(job: job)

    expect(job.reload).to have_attributes(status: "failed", error_message: "quota_exceeded")
    expect(job.blob).to be_nil
  end

  it "marks the job failed when writing raises (F-17)" do
    job = create(:export_job)
    allow(ExportJobs::Writer).to receive(:call).and_raise(StandardError, "boom")

    described_class.call(job: job)

    expect(job.reload).to have_attributes(status: "failed", error_message: "unreadable")
  end

  it "no-ops for a missing or already-ready job" do
    expect(described_class.call(export_job_id: 0).value).to be_nil
    ready = create(:export_job, status: "ready")
    expect(described_class.call(job: ready).value.status).to eq("ready")
  end

  it "does not raise when fail_record! is given a missing row" do
    expect { described_class.new.fail_record!(nil, "unreadable") }.not_to raise_error
  end
end
