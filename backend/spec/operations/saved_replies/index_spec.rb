require "rails_helper"

RSpec.describe SavedReplies::Index do
  it "orders by position then id" do
    account = create(:user).account
    later = SavedReplies::Create.call(account: account, shortcut: "/b", body: "B", position: 1).value
    earlier = SavedReplies::Create.call(account: account, shortcut: "/a", body: "A", position: 0).value
    result = described_class.call(account: account, saved_replies: SavedReply.all)

    expect(result.value.saved_replies).to eq([ earlier, later ])
  end
end
