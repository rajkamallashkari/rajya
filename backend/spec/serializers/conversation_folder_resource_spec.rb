require "rails_helper"

RSpec.describe ConversationFolderResource do
  it "lists conversation ids in folder order" do
    account = create(:user).account
    folder = create(:conversation_folder, account: account)
    first = create_direct_between(account, create(:account))
    second = create_direct_between(account, create(:account))
    create(:conversation_folder_entry, folder: folder, conversation: second, position: 1)
    create(:conversation_folder_entry, folder: folder, conversation: first, position: 0)
    json = described_class.new(folder).to_h

    expect(json).to include("id" => folder.id, "name" => folder.name, "position" => folder.position)
    expect(json.fetch("conversation_ids")).to eq([ first.id, second.id ])
  end

  it "uses loaded entries when the association is preloaded" do
    folder = create(:conversation_folder)
    conversation = create_direct_between(folder.account, create(:account))
    create(:conversation_folder_entry, folder: folder, conversation: conversation)
    json = described_class.new(ConversationFolder.includes(:conversation_folder_entries).find(folder.id)).to_h

    expect(json.fetch("conversation_ids")).to eq([ conversation.id ])
  end
end
