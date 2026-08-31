require "rails_helper"

RSpec.describe Admin::BotRequestPolicy do
  it "allows an admin and forbids a regular user" do
    request = create(:bot_request, requester_account: create(:user).account)
    admin = create(:user, :admin)
    expect(described_class.new(admin, request)).to be_index.and be_approve.and be_decline
    expect(described_class.new(create(:user), request)).not_to be_approve
  end
end
