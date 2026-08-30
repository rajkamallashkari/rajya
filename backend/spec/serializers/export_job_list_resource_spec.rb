require "rails_helper"

RSpec.describe ExportJobListResource do
  it "wraps jobs" do
    job = create(:export_job)
    json = described_class.new(ExportJobs::List.new(export_jobs: [ job ])).to_h

    expect(json.fetch("export_jobs").sole.fetch("id")).to eq(job.id)
  end
end
