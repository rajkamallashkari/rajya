require "rails_helper"

RSpec.describe BotRequestPolicy do
  it "allows a human to file and withdraw their own requests" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)
    expect(described_class.new(user.account, BotRequest)).to be_index.and be_create
    expect(described_class.new(user.account, request)).to be_destroy
    expect(described_class.new(create(:bot).account, BotRequest)).not_to be_create
  end

  it "scopes to the requester and none without an account" do
    user = create(:user)
    mine = create(:bot_request, requester_account: user.account)
    create(:bot_request)

    expect(described_class::Scope.new(user.account, BotRequest.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, BotRequest.all).resolve).to be_empty
  end
end
