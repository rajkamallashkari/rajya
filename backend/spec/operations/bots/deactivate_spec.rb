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

  it "lets an admin deactivate a system bot and keeps existing chats resolvable (BR-81)" do
    admin = create(:user, :admin)
    bot = create(:bot)
    conversation = create_direct_between(admin.account, bot.account)
    described_class.call(actor: admin.account, bot: bot)

    expect(bot.reload).to be_deactivated
    expect(conversation.conversation_memberships.find_by(account_id: bot.account_id)).to be_present
    expect(described_class.call(actor: admin.account, bot: bot.reload).error_code).to eq(:not_found)
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
