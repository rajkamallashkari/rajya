require "rails_helper"

RSpec.describe MeResource do
  it "nests account and user" do
    user = create(:user, phone: "1555", phone_verified_at: Time.current)
    json = described_class.new(Users::Me.new(account: user.account, user: user)).to_h

    expect(json.fetch("account").fetch("username")).to eq(user.account.username)
    expect(json.fetch("user")).to include("phone" => "1555", "phone_verified" => true, "is_admin" => false)
    expect(json["impersonation"]).to be_nil
  end

  it "includes impersonation when the impersonator id is in params" do
    admin = create(:user, :admin)
    target = create(:user)
    json = described_class.new(
      Users::Me.new(account: target.account, user: admin),
      params: { impersonator_id: admin.id }
    ).to_h

    expect(json.fetch("impersonation")).to eq(
      "impersonator_id" => admin.id,
      "account_id" => target.account_id,
      "display_name" => target.account.display_name
    )
  end
end
