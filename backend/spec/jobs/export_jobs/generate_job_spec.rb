require "rails_helper"

RSpec.describe ExportJobs::GenerateJob do
  it "delegates to ExportJobs::Generate" do
    job = create(:export_job)
    allow(ExportJobs::Generate).to receive(:call).and_return(Result.success(job))

    described_class.perform_now(job.id)

    expect(ExportJobs::Generate).to have_received(:call).with(export_job_id: job.id)
  end
end
