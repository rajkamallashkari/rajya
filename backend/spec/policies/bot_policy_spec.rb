require "rails_helper"

RSpec.describe BotPolicy do
  it "allows a human to list, show, and deactivate and denies a bot" do
    bot = create(:bot)
    expect(described_class.new(create(:user).account, bot)).to be_index.and be_show.and be_destroy
    expect(described_class.new(create(:bot).account, bot)).not_to be_index
  end

  it "scopes to active bots and none without an account" do
    live = create(:bot)
    dead = create(:bot)
    dead.deactivate!

    expect(described_class::Scope.new(create(:user).account, Bot.all).resolve).to contain_exactly(live)
    expect(described_class::Scope.new(nil, Bot.all).resolve).to be_empty
  end
end
