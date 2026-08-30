require "rails_helper"

RSpec.describe JoinRequestResource do
  it "includes the requester account" do
    request = create(:join_request)
    json = described_class.new(request).to_h

    expect(json).to include("id" => request.id, "status" => "pending")
    expect(json.fetch("account").fetch("id")).to eq(request.account_id)
  end
end
