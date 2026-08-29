require "rails_helper"

RSpec.describe Users::Deactivate do
  it "deactivates the account and bumps credentials_epoch" do
    user = create(:user)
    expect(described_class.call(user: user)).to be_success
    expect(user.account.reload).to be_deactivated
    expect(user.reload.credentials_epoch).to eq(1)
  end

  it "is idempotent after the account is already deactivated" do
    user = create(:user)
    described_class.call(user: user)
    expect(described_class.call(user: user)).to be_success
    expect(user.reload.credentials_epoch).to eq(1)
  end
end
