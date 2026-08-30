require "rails_helper"

RSpec.describe JoinRequestListResource do
  it "wraps join requests" do
    request = create(:join_request)
    json = described_class.new(JoinRequests::List.new(join_requests: [ request ])).to_h

    expect(json.fetch("join_requests").sole.fetch("id")).to eq(request.id)
  end
end
