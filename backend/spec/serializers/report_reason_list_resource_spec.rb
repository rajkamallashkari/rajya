require "rails_helper"

RSpec.describe ReportReasonListResource do
  it "wraps reason id and label pairs" do
    list = Reports::ReasonList.new(reasons: [ Reports::Reason.new(id: "spam", label: "Spam") ])
    json = described_class.new(list).to_h

    expect(json.fetch("reasons")).to eq([ { "id" => "spam", "label" => "Spam" } ])
  end
end
