require "rails_helper"

RSpec.describe User do
  it "is valid on a human account" do
    expect(build(:user)).to be_valid
  end

  it "is invalid when attached to a bot account" do
    user = build(:user, account: create(:account, :bot_kind))

    expect(user).not_to be_valid
    expect(user.errors[:account]).to include(Catalog.t("errors.models.user.account_kind"))
  end

  it "skips the kind check when no account is set" do
    user = described_class.new

    expect(user).not_to be_valid
    expect(user.errors[:account]).not_to include(Catalog.t("errors.models.user.account_kind"))
  end

  it "bumps credentials_epoch so every outstanding JWT is rejected" do
    user = create(:user)
    expect { user.revoke_all_credentials! }.to change { user.reload.credentials_epoch }.by(1)
  end

  it "authenticates a password through has_secure_password" do
    user = create(:user, :with_password)

    expect(user.authenticate("password12")).to eq(user)
    expect(user.authenticate("wrongpass")).to be(false)
  end

  it "always writes last_active_at even when the privacy flag is off (BR-43)" do
    user = create(:user)
    create(:preference, account: user.account, data: { "privacy" => { "last_active" => false } })
    seen_at = Time.zone.parse("2026-08-30 12:00:00")

    user.record_last_active!(at: seen_at)

    expect(user.reload.last_active_at).to eq(seen_at)
  end
end
