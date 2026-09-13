require "rails_helper"

RSpec.describe Accounts::ShowProfile do
  it "returns a visible account" do
    viewer = create(:account)
    target = create(:account)
    profile = described_class.call(viewer: viewer, account_id: target.id).value

    expect(profile.account).to eq(target)
    expect(profile.blocked_by_viewer).to be(false)
  end

  it "returns an account blocked by the viewer so they can unblock it" do
    viewer = create(:account)
    target = create(:account)
    create(:block, blocker_account: viewer, blocked_account: target)

    profile = described_class.call(viewer: viewer, account_id: target.id).value

    expect(profile.account).to eq(target)
    expect(profile.blocked_by_viewer).to be(true)
  end

  it "exposes human contact fields only when the owner permits them" do
    viewer = create(:account)
    target = create(:account)
    user = create(:user, account: target, email: "owner@example.com", phone: "+12025550147")
    create(
      :preference,
      account: target,
      data: { "privacy" => { "show_email_on_profile" => true, "show_phone_on_profile" => false } }
    )

    profile = described_class.call(viewer:, account_id: target.id).value

    expect(profile.email).to eq(user.email)
    expect(profile.phone).to be_nil
  end

  it "exposes a human phone number when the owner permits it" do
    viewer = create(:account)
    target = create(:account)
    user = create(:user, account: target, email: "owner@example.com", phone: "+12025550147")
    create(
      :preference,
      account: target,
      data: { "privacy" => { "show_email_on_profile" => false, "show_phone_on_profile" => true } }
    )

    profile = described_class.call(viewer:, account_id: target.id).value

    expect(profile.email).to be_nil
    expect(profile.phone).to eq(user.phone)
  end

  it "never exposes contact fields for bots" do
    viewer = create(:account)
    target = create(:account, :bot_kind)
    create(
      :preference,
      account: target,
      data: { "privacy" => { "show_email_on_profile" => true, "show_phone_on_profile" => true } }
    )

    profile = described_class.call(viewer:, account_id: target.id).value

    expect(profile.email).to be_nil
    expect(profile.phone).to be_nil
  end

  it "hides missing, deactivated, reverse-blocked, and mutually blocked accounts (NR-1)" do
    viewer = create(:account)
    expect(described_class.call(viewer: viewer, account_id: 0).error_code).to eq(:not_found)

    gone = create(:account, :deactivated)
    expect(described_class.call(viewer: viewer, account_id: gone.id).error_code).to eq(:not_found)

    other = create(:account)
    create(:block, blocker_account: other, blocked_account: viewer)
    expect(described_class.call(viewer: viewer, account_id: other.id).error_code).to eq(:not_found)

    mutual = create(:account)
    create(:block, blocker_account: viewer, blocked_account: mutual)
    create(:block, blocker_account: mutual, blocked_account: viewer)
    expect(described_class.call(viewer: viewer, account_id: mutual.id).error_code).to eq(:not_found)
  end
end
