require "rails_helper"

RSpec.describe Folders::Index do
  it "returns the account's folders in position order" do
    account = create(:user).account
    later = Folders::Create.call(account: account, name: "Later", position: 1).value
    first = Folders::Create.call(account: account, name: "First", position: 0).value
    Folders::Create.call(account: create(:user).account, name: "Other")
    result = described_class.call(account: account, folders: ConversationFolder.all)

    expect(result.value.folders).to eq([ first, later ])
  end
end
