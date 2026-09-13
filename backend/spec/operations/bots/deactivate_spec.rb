require "rails_helper"

RSpec.describe Bots::Deactivate do
  it "hides the bot from the directory while the record remains (BR-81)" do
    owner = create(:user)
    bot = create(:bot, owner_account: owner.account)
    described_class.call(actor: owner.account, bot: bot)

    expect(bot.reload).to be_deactivated
    expect(Bots::Index.call.value.bots).not_to include(bot)
    expect(Bots::Show.call(bot_id: bot.id).error_code).to eq(:not_found)
  end

  it "forbids a stranger from deactivating a user bot" do
    bot = create(:bot, owner_account: create(:user).account)
    expect(described_class.call(actor: create(:user).account, bot: bot).error_code).to eq(:forbidden)
  end

  it "does not let an admin deactivate an unowned system bot" do
    admin = create(:user, :admin)
    bot = create(:bot)

    expect(described_class.call(actor: admin.account, bot: bot).error_code).to eq(:forbidden)
    expect(described_class.call(actor: admin.account, bot: nil).error_code).to eq(:not_found)
  end

  it "forbids a non-admin from deactivating a system bot" do
    bot = create(:bot)
    expect(described_class.call(actor: create(:user).account, bot: bot).error_code).to eq(:forbidden)
  end

  it "lets an owner without a user row deactivate their bot" do
    owner = create(:account)
    bot = create(:bot, owner_account: owner)
    expect(described_class.call(actor: owner, bot: bot)).to be_success
  end
end
