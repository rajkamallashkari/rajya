require "rails_helper"

RSpec.describe SavedReplies::Destroy do
  it "destroys the owner's reply" do
    account = create(:user).account
    row = SavedReplies::Create.call(account: account, shortcut: "/omw", body: "A").value
    described_class.call(saved_reply: row, actor: account)
    expect(SavedReply.where(id: row.id)).not_to exist
  end

  it "forbids another account" do
    account = create(:user).account
    row = SavedReplies::Create.call(account: account, shortcut: "/omw", body: "A").value
    expect(described_class.call(saved_reply: row, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
