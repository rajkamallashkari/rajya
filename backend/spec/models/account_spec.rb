require "rails_helper"

RSpec.describe Account do
  it "is valid as a human participant" do
    expect(build(:account)).to be_valid
  end

  it "reports human? and bot? from kind" do
    expect(build(:account)).to be_human
    expect(build(:account, :bot_kind)).to be_bot
  end

  it "treats a timestamped deactivated_at as deactivated" do
    expect(build(:account, :deactivated)).to be_deactivated
    expect(build(:account)).not_to be_deactivated
  end

  describe "#last_active_at_visible_to" do
    let(:owner) { create(:user) }
    let(:viewer) { create(:user) }
    let(:seen_at) { Time.zone.parse("2026-08-30 12:00:00") }

    before { owner.record_last_active!(at: seen_at) }

    it "returns last_active_at when both humans have last_active enabled (BR-42)" do
      expect(owner.account.reload.last_active_at_visible_to(viewer.account)).to eq(seen_at)
    end

    it "hides last_active_at when the owner has last_active off" do
      create(:preference, account: owner.account, data: { "privacy" => { "last_active" => false } })

      expect(owner.account.reload.last_active_at_visible_to(viewer.account)).to be_nil
    end

    it "hides last_active_at when the viewer has last_active off (BR-42 symmetry)" do
      create(:preference, account: viewer.account, data: { "privacy" => { "last_active" => false } })

      expect(owner.account.last_active_at_visible_to(viewer.account.reload)).to be_nil
    end

    it "hides last_active_at from a bot viewer" do
      bot_account = create(:bot).account

      expect(owner.account.last_active_at_visible_to(bot_account)).to be_nil
    end

    it "does not expose last_active_at for a bot account" do
      bot_account = create(:bot).account

      expect(bot_account.last_active_at_visible_to(viewer.account)).to be_nil
    end

    it "returns nil when the human account has no user row" do
      orphan = create(:account)

      expect(orphan.last_active_at_visible_to(viewer.account)).to be_nil
    end
  end

  describe "discoverability (BR-45, BR-46, BR-47)" do
    it "defaults username findability on and email/phone findability off" do
      account = build(:account)

      expect(account).to be_discoverable_by_username
      expect(account).not_to be_discoverable_by_email
      expect(account).not_to be_discoverable_by_phone
    end

    it "reads discoverable_by_username from preferences, closing the dead-column hole (BR-47)" do
      account = create(:account)
      create(:preference, account: account, data: { "privacy" => { "discoverable_by_username" => false } })

      expect(account.reload).not_to be_discoverable_by_username
    end
  end
end
