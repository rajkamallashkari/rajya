require "rails_helper"

RSpec.describe Search::People do
  it "wraps account hits" do
    viewer = create(:user)
    target = create(:user, account: create(:account, username: "needleuser", display_name: "Needle"))
    result = described_class.call(account: viewer.account, query: "needle")

    expect(result.value.accounts.sole.id).to eq(target.account.id)
  end
end
