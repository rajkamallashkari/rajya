require "rails_helper"

RSpec.describe CallListResource do
  it "wraps log entries and page meta" do
    user = create(:user)
    json = described_class.new(
      Calls::Page::Result.new(calls: [], page: 1, per_page: 50, total: 0, has_more: false)
    ).to_h

    expect(json.fetch("calls")).to eq([])
    expect(json.fetch("meta")).to include("page" => 1, "total" => 0, "has_more" => false)
  end
end
