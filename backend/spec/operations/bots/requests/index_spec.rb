require "rails_helper"

RSpec.describe Bots::Requests::Index do
  it "returns only the actor's requests unless admin" do
    user = create(:user)
    mine = create(:bot_request, requester_account: user.account)
    create(:bot_request, requester_account: create(:user).account)

    ids = described_class.call(actor: user.account).value.bot_requests.map(&:id)
    expect(ids).to eq([ mine.id ])

    all = described_class.call(actor: user.account, admin: true).value.bot_requests.map(&:id)
    expect(all.size).to eq(2)
  end

  it "filters the admin queue by pending status and optional kind" do
    user = create(:user)
    pending_edit = create(:bot_request, requester_account: user.account, kind: "edit")
    create(:bot_request, requester_account: user.account, kind: "create")
    create(:bot_request, requester_account: user.account, status: "approved")

    requests = described_class.call(
      actor: user.account, admin: true, status: "pending", kind: "edit"
    ).value.bot_requests
    expect(requests).to contain_exactly(pending_edit)
  end
end
