require "rails_helper"

RSpec.describe ExportJobResource do
  it "serializes failure copy from the catalog" do
    job = create(:export_job, status: "failed", error_message: "quota_exceeded")
    json = described_class.new(job).to_h

    expect(json).to include(
      "id" => job.id,
      "format" => "json",
      "error_message" => Catalog.t("export.errors.quota_exceeded")
    )
  end

  it "omits error_message when it is blank" do
    expect(described_class.new(create(:export_job)).to_h.fetch("error_message")).to be_nil
    expired = create(:export_job, status: "failed", error_message: "expired")
    expect(described_class.new(expired).to_h.fetch("error_message")).to eq(Catalog.t("export.errors.expired"))
  end
end
