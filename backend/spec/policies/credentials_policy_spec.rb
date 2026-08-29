require "rails_helper"

RSpec.describe CredentialsPolicy do
  let(:user) { create(:user) }

  it "allows a human to change and verify their password" do
    policy = described_class.new(user.account, user)

    expect(policy).to be_update_password
    expect(policy).to be_verify_password
  end

  it "allows a human to remove email, password, and Google" do
    policy = described_class.new(user.account, user)

    expect(policy).to be_destroy_email
    expect(policy).to be_destroy_password
    expect(policy).to be_destroy_google
  end

  it "forbids acting on a different user's credentials" do
    policy = described_class.new(create(:user).account, user)

    expect(policy).not_to be_update_password
    expect(policy).not_to be_destroy_email
  end
end
