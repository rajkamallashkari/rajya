require "rails_helper"

RSpec.describe SessionResource do
  it "includes token, account and onboarded=false for a new user" do
    user = create(:user)
    json = described_class.new(Auth::Session.issue(user)).to_h

    expect(json.fetch("token")).to be_present
    expect(json.fetch("account").fetch("username")).to eq(user.account.username)
    expect(json.fetch("user").fetch("onboarded")).to be(false)
  end

  it "marks onboarded when onboarded_at is set" do
    user = create(:user, onboarded_at: Time.current)
    json = described_class.new(Auth::Session.issue(user)).to_h

    expect(json.fetch("user").fetch("onboarded")).to be(true)
  end
end
