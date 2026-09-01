require "rails_helper"

RSpec.describe AdminReportResource do
  it "includes reporter and subject context" do
    target = create(:account, display_name: "Peer")
    report = create(:report, subject_type: "account", subject_id: target.id, details: "note")
    item = Admin::Reports::Item.new(report: report, subject: Admin::Reports::Preview.call(report))
    json = described_class.new(item).to_h

    expect(json).to include("id" => report.id, "reason" => "spam", "details" => "note")
    expect(json.dig("reporter", "id")).to eq(report.reporter_account_id)
    expect(json.dig("subject", "label")).to eq("Peer")
  end

  it "wraps a list of reports" do
    report = create(:report)
    item = Admin::Reports::Item.new(report: report, subject: Admin::Reports::Preview.call(report))
    json = AdminReportListResource.new(Admin::Reports::List.new(reports: [ item ])).to_h
    expect(json.fetch("reports").sole.fetch("id")).to eq(report.id)
  end
end
