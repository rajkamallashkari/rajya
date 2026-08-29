require "rails_helper"

RSpec.describe Accounts::CheckUsername do
  it "reports availability excluding the current account" do
    account = create(:account, username: "ada")

    expect(described_class.call(username: "ada", except_id: account.id).value.available).to be(true)
    expect(described_class.call(username: "ada").value.available).to be(false)
    expect(described_class.call(username: "ab").value.available).to be(false)
  end
end
