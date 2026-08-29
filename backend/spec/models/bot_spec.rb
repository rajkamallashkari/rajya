require "rails_helper"

RSpec.describe Bot do
  it "is valid on a bot account" do
    expect(build(:bot)).to be_valid
  end

  it "is invalid when attached to a human account" do
    bot = build(:bot, account: create(:account))

    expect(bot).not_to be_valid
    expect(bot.errors[:account]).to include(Catalog.t("errors.models.bot.account_kind"))
  end

  it "skips the kind check when no account is set" do
    bot = described_class.new

    expect(bot).not_to be_valid
    expect(bot.errors[:account]).not_to include(Catalog.t("errors.models.bot.account_kind"))
  end

  it "allows a system bot with no owner" do
    expect(create(:bot).owner_account).to be_nil
  end
end
