require "rails_helper"

RSpec.describe BotPolicy do
  it "allows humans to list/show and only owners to deactivate" do
    owner = create(:user)
    bot = create(:bot, owner_account: owner.account)
    expect(described_class.new(owner.account, bot)).to be_index.and be_show.and be_destroy
    expect(described_class.new(create(:user).account, bot)).not_to be_destroy
    expect(described_class.new(create(:bot).account, bot)).not_to be_index
  end

  it "scopes to active owned bots and none without an account" do
    owner = create(:user)
    live = create(:bot, owner_account: owner.account)
    create(:bot)
    dead = create(:bot, owner_account: owner.account)
    dead.deactivate!

    expect(described_class::Scope.new(owner.account, Bot.all).resolve).to contain_exactly(live)
    expect(described_class::Scope.new(nil, Bot.all).resolve).to be_empty
  end
end
