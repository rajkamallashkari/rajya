require "rails_helper"

RSpec.describe ReportResource do
  it "exposes the submission fields" do
    report = create(:report, reason: "spam", details: "note")
    json = described_class.new(report).to_h

    expect(json).to include(
      "id" => report.id, "subject_type" => "account", "subject_id" => report.subject_id,
      "reason" => "spam", "details" => "note", "status" => "pending"
    )
    expect(json.fetch("created_at")).to be_present
  end
end
