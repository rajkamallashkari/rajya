require "rails_helper"

RSpec.describe Users::Show do
  it "wraps the user and account" do
    user = create(:user)
    result = described_class.call(user: user)

    expect(result.value.user).to eq(user)
    expect(result.value.account).to eq(user.account)
  end
end
