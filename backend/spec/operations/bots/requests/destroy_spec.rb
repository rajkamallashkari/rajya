require "rails_helper"

RSpec.describe Bots::Requests::Destroy do
  it "deletes a pending request owned by the actor" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)

    expect(described_class.call(actor: user.account, request: request)).to be_success
    expect(BotRequest.find_by(id: request.id)).to be_nil
  end

  it "forbids another account and a decided request" do
    owner = create(:user)
    request = create(:bot_request, requester_account: owner.account)
    expect(described_class.call(actor: create(:user).account, request: request).error_code).to eq(:forbidden)

    request.update!(status: "approved")
    expect(described_class.call(actor: owner.account, request: request).error_code).to eq(:conflict)
  end

  it "returns not_found when the request is missing" do
    expect(described_class.call(actor: create(:user).account, request: nil).error_code).to eq(:not_found)
  end
end
