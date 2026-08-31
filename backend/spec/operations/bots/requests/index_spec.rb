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
end
