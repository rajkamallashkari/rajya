require "rails_helper"

RSpec.describe ExportJobs::IssueUrl do
  around do |example|
    ActiveStorage::Current.url_options = { host: "www.example.com" }
    example.run
  ensure
    ActiveStorage::Current.reset
  end

  def ready_job
    job = create(:export_job, status: "ready")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("body"), filename: "e.json", content_type: "application/json")
    job.update!(blob: blob)
    job
  end

  it "issues a short-lived URL for a ready artefact" do
    job = ready_job
    result = described_class.call(job: job)

    expect(result).to be_success
    expect(result.value.url).to be_present
  end

  it "hides missing, expired, or incomplete artefacts" do
    pending = create(:export_job)
    expect(described_class.call(job: pending).error_code).to eq(:not_found)

    expired = ready_job
    expired.update!(expires_at: 1.minute.ago)
    expect(described_class.call(job: expired).error_code).to eq(:not_found)
  end
end
