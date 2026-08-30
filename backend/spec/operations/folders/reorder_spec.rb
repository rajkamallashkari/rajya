require "rails_helper"

RSpec.describe Folders::Reorder do
  it "persists client-managed folder order" do
    account = create(:user).account
    first = Folders::Create.call(account: account, name: "A").value
    second = Folders::Create.call(account: account, name: "B").value
    result = described_class.call(account: account, ids: [ second.id, first.id ], folders: ConversationFolder.all)

    expect(result.value.folders.map(&:id)).to eq([ second.id, first.id ])
    expect(result.value.folders.map(&:position)).to eq([ 0, 1 ])
  end

  it "rejects a list that is not a permutation of the account's folders" do
    account = create(:user).account
    folder = Folders::Create.call(account: account, name: "A").value
    other = Folders::Create.call(account: create(:user).account, name: "B").value

    expect(described_class.call(account: account, ids: [ folder.id, other.id ],
                                folders: ConversationFolder.all).error_code).to eq(:validation_failed)
    expect(described_class.call(account: account, ids: [], folders: ConversationFolder.all).error_code)
      .to eq(:validation_failed)
  end
end
