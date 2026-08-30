require "rails_helper"

RSpec.describe Reports::Reasons do
  it "returns the configured reasons with catalog labels" do
    result = described_class.call

    expect(result).to be_success
    expect(result.value.reasons.map(&:id)).to eq(Array(Settings.fetch(:report_reasons)).map(&:to_s))
    expect(result.value.reasons.first.label).to eq(Catalog.t("report.reasons.spam"))
  end

  it "returns an empty list when no reasons are configured" do
    stub_setting(:report_reasons, [], category: "moderation")

    expect(described_class.call.value.reasons).to eq([])
  end
end
