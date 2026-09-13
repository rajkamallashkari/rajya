require "rails_helper"

# rubocop:disable RSpec/MultipleExpectations -- The policy state matrix is clearest in one example.
RSpec.describe BotRequestPolicy do
  it "allows owners to update or withdraw pending and declined requests" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)
    expect(described_class.new(user.account, BotRequest)).to be_index.and be_create
    expect(described_class.new(user.account, request)).to be_update.and be_destroy
    request.update!(status: "declined")
    expect(described_class.new(user.account, request)).to be_update.and be_destroy
    outsider_policy = described_class.new(create(:user).account, request)
    expect(outsider_policy).not_to be_update
    expect(outsider_policy).not_to be_destroy
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
# rubocop:enable RSpec/MultipleExpectations
