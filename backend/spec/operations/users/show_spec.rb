require "rails_helper"

RSpec.describe Users::Show do
  it "wraps the user and account" do
    user = create(:user)
    result = described_class.call(user: user)

    expect(result.value.user).to eq(user)
    expect(result.value.account).to eq(user.account)
  end

  it "uses an explicit account during impersonation" do
    admin = create(:user, :admin)
    target = create(:user)
    result = described_class.call(user: admin, account: target.account)

    expect(result.value.user).to eq(admin)
    expect(result.value.account).to eq(target.account)
  end
end
