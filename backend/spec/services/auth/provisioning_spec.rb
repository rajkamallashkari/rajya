require "rails_helper"

RSpec.describe Auth::Provisioning do
  it "creates an account, user and empty preferences row together" do
    user = described_class.create_human!(email: "new@example.com", display_name: "New", password: "password12")

    expect(user.account).to be_human
    expect(user.account.username).to eq("new")
    expect(user.account.preference).to be_present
    expect(user.authenticate("password12")).to eq(user)
  end

  it "stamps email_verified_at when Google reports a verified address" do
    user = described_class.create_human!(
      email: "g@example.com",
      display_name: "G",
      google_subject: "sub-1",
      email_verified: true
    )

    expect(user.email_verified_at).to be_present
    expect(user.google_subject).to eq("sub-1")
  end
end
