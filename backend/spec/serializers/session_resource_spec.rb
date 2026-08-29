require "rails_helper"

RSpec.describe SessionResource do
  it "includes token, account and onboarded=false for a new user" do
    user = create(:user)
    json = described_class.new(Auth::Session.issue(user)).to_h

    expect(json.fetch("token")).to be_present
    expect(json.fetch("account").fetch("username")).to eq(user.account.username)
    expect(json.fetch("user").fetch("onboarded")).to be(false)
  end

  it "reports password and passkey presence for App Lock" do
    user = create(:user, :with_password)
    create(:passkey, user: user)
    json = described_class.new(Auth::Session.issue(user)).to_h

    expect(json.fetch("user").fetch("has_password")).to be(true)
    expect(json.fetch("user").fetch("has_passkey")).to be(true)
  end

  it "marks onboarded when onboarded_at is set" do
    user = create(:user, onboarded_at: Time.current)
    json = described_class.new(Auth::Session.issue(user)).to_h

    expect(json.fetch("user").fetch("onboarded")).to be(true)
  end
end
