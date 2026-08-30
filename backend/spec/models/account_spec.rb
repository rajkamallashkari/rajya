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

  it "rejects a username that is too short or has invalid characters" do
    expect(build(:account, username: "ab")).not_to be_valid
    expect(build(:account, username: "ada!")).not_to be_valid
  end

  it "skips the format check when username is blank" do
    account = build(:account, username: "")
    expect(account).not_to be_valid
    expect(account.errors[:username]).not_to include(a_string_matching(/letters/))
  end

  describe "#blocked_with?" do
    it "is true when either account has blocked the other" do
      a = create(:account)
      b = create(:account)
      create(:block, blocker_account: a, blocked_account: b)

      expect(a.blocked_with?(b)).to be(true)
      expect(b.blocked_with?(a)).to be(true)
    end

    it "is false for missing or self" do
      account = create(:account)

      expect(account.blocked_with?(nil)).to be(false)
      expect(account.blocked_with?(account)).to be(false)
    end
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

    it "defaults read_receipts on and honors a stored override" do
      account = create(:account)
      expect(account).to be_read_receipts

      create(:preference, account: account, data: { "privacy" => { "read_receipts" => false } })
      expect(account.reload).not_to be_read_receipts
    end
  end
end
