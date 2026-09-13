require "rails_helper"

RSpec.describe Accounts::ResolveDirectTarget do
  it "resolves active humans and bots by exact username case-insensitively" do
    creator = create(:user).account
    human = create(:account, username: "Hidden.Human")
    bot = create(:bot, account: create(:account, :bot_kind, username: "Helper.Bot"))
    create(:preference, account: human, data: { "privacy" => { "discoverable_by_username" => false } })

    expect(described_class.call(creator: creator, username: "HIDDEN.HUMAN").value).to eq(human)
    expect(described_class.call(creator: creator, username: "helper.bot").value).to eq(bot.account)
  end

  it "resolves self when no target or the current username is given" do
    creator = create(:user).account

    expect(described_class.call(creator: creator).value).to eq(creator)
    expect(described_class.call(creator: creator, username: creator.username.upcase).value).to eq(creator)
  end

  it "rejects ambiguous, missing, partial, and deactivated targets" do
    creator = create(:user).account
    active = create(:account, username: "exact.name")
    deactivated = create(:account, :deactivated, username: "gone")

    expect(
      described_class.call(creator: creator, account_id: active.id, username: active.username).error_code
    ).to eq(:validation_failed)
    expect(described_class.call(creator: creator, username: "exact").error_code).to eq(:not_found)
    expect(described_class.call(creator: creator, username: deactivated.username).error_code).to eq(:not_found)
    expect(described_class.call(creator: creator, account_id: deactivated.id).error_code).to eq(:not_found)
  end
end
