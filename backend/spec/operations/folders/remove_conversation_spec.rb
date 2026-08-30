require "rails_helper"

RSpec.describe Folders::RemoveConversation do
  it "removes the entry from the owner's folder" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    folder = Folders::Create.call(account: user.account, name: "Work").value
    Folders::AddConversation.call(account: user.account, folder: folder, conversation: conversation)
    described_class.call(account: user.account, folder: folder, conversation: conversation)

    expect(folder.conversation_folder_entries).to be_empty
  end

  it "forbids a conversation the account cannot see" do
    user = create(:user)
    folder = Folders::Create.call(account: user.account, name: "Work").value
    hidden = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    expect(described_class.call(account: user.account, folder: folder, conversation: hidden).error_code)
      .to eq(:forbidden)
  end

  it "forbids a stranger's folder" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    folder = Folders::Create.call(account: user.account, name: "Work").value
    expect(described_class.call(account: create(:user).account, folder: folder, conversation: conversation).error_code)
      .to eq(:forbidden)
  end
end
