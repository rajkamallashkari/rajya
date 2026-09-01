require "rails_helper"

RSpec.describe MeResource do
  it "nests account and user" do
    user = create(:user, phone: "1555", phone_verified_at: Time.current)
    json = described_class.new(Users::Me.new(account: user.account, user: user)).to_h

    expect(json.fetch("account").fetch("username")).to eq(user.account.username)
    expect(json.fetch("user").fetch("phone")).to eq("1555")
    expect(json.fetch("user").fetch("phone_verified")).to be(true)
    expect(json.fetch("user").fetch("is_admin")).to be(false)
  end
end
