require "rails_helper"

RSpec.describe UsersPolicy do
  let(:user) { create(:user) }

  it "allows a human to manage their own profile" do
    policy = described_class.new(user.account, user)

    expect(policy).to be_show
    expect(policy).to be_update
    expect(policy).to be_destroy
  end

  it "allows onboarding and email-change actions on the same profile" do
    policy = described_class.new(user.account, user)

    expect(policy).to be_complete_onboarding
    expect(policy).to be_change_email
    expect(policy).to be_verify_email
  end

  it "forbids another account" do
    policy = described_class.new(create(:user).account, user)

    expect(policy).not_to be_show
  end
end
