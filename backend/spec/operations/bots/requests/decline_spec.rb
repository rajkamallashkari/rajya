require "rails_helper"

RSpec.describe Bots::Requests::Decline do
  it "records a reason and refuses a second decision" do
    admin = create(:user, :admin)
    request = create(:bot_request, requester_account: create(:user).account)

    described_class.call(admin: admin, request: request, reason: "Too thin")
    expect(request.reload).to have_attributes(status: "declined", decline_reason: "Too thin")
    expect(described_class.call(admin: admin, request: request).error_code).to eq(:conflict)
  end

  it "refuses a non-admin and a missing request" do
    request = create(:bot_request, requester_account: create(:user).account)
    expect(described_class.call(admin: create(:user), request: request).error_code).to eq(:forbidden)
    expect(described_class.call(admin: create(:user, :admin), request: nil).error_code).to eq(:not_found)
  end
end
