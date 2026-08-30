require "rails_helper"

RSpec.describe ExportJobs::Show do
  it "returns the job" do
    job = create(:export_job)

    expect(described_class.call(job: job).value).to eq(job)
  end
end
