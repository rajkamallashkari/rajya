require "rails_helper"

RSpec.describe BlockPolicy do
  let(:user) { create(:user) }
  let(:block) { create(:block, blocker_account: user.account) }

  it "allows a human to list and create blocks" do
    policy = described_class.new(user.account, Block)

    expect(policy).to be_index
    expect(policy).to be_create
  end

  it "allows the blocker to destroy their block" do
    expect(described_class.new(user.account, block)).to be_destroy
    expect(described_class.new(create(:user).account, block)).not_to be_destroy
  end

  it "scopes to the acting account's initiated blocks" do
    mine = block
    create(:block)
    expect(described_class::Scope.new(user.account, Block.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, Block.all).resolve).to be_empty
  end
end
