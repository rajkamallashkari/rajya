require "rails_helper"

RSpec.describe ExportJob do
  it "identifies expired and ready rows" do
    ready = build(:export_job, status: "ready", expires_at: 1.hour.from_now)
    expired = create(:export_job, expires_at: 1.minute.ago)

    expect(ready).to be_ready
    expect(ready).not_to be_expired
    expect(expired).to be_expired
    expect(described_class.expired).to contain_exactly(expired)
  end
end
