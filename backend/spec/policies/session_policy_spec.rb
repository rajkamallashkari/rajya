require "rails_helper"

RSpec.describe SessionPolicy do
  let(:user) { create(:user) }
  let(:session) { create(:session, user: user) }

  it "allows a human to list sessions and revoke others" do
    policy = described_class.new(user.account, Session)

    expect(policy).to be_index
    expect(policy).to be_others
  end

  it "allows the owner to destroy their session" do
    expect(described_class.new(user.account, session)).to be_destroy
    expect(described_class.new(create(:user).account, session)).not_to be_destroy
    expect(described_class.new(user.account, Session)).not_to be_destroy
  end

  it "forbids a bot account from indexing" do
    expect(described_class.new(create(:account, :bot_kind), Session)).not_to be_index
  end

  it "forbids a human account that has no user" do
    expect(described_class.new(create(:account), Session)).not_to be_index
  end

  it "scopes to the acting human's active sessions" do
    mine = session
    create(:session, :revoked, user: user)
    create(:session)

    expect(described_class::Scope.new(user.account, Session.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, Session.all).resolve).to be_empty
  end
end
