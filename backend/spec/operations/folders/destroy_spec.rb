require "rails_helper"

RSpec.describe Folders::Destroy do
  it "destroys the folder and its entries" do
    account = create(:user).account
    folder = Folders::Create.call(account: account, name: "Work").value
    conversation = create_direct_between(account, create(:account))
    Folders::AddConversation.call(account: account, folder: folder, conversation: conversation)
    described_class.call(folder: folder, actor: account)

    expect(ConversationFolder.where(id: folder.id)).not_to exist
    expect(ConversationFolderEntry.where(folder_id: folder.id)).not_to exist
  end

  it "forbids another account" do
    folder = Folders::Create.call(account: create(:user).account, name: "Work").value
    expect(described_class.call(folder: folder, actor: create(:user).account).error_code).to eq(:forbidden)
  end
end
