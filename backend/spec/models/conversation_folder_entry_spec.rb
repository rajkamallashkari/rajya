require "rails_helper"

RSpec.describe ConversationFolderEntry do
  it "rejects a duplicate conversation in the same folder" do
    folder = create(:conversation_folder)
    conversation = create(:conversation)
    create(:conversation_folder_entry, folder: folder, conversation: conversation)
    duplicate = build(:conversation_folder_entry, folder: folder, conversation: conversation)

    expect(duplicate).not_to be_valid
  end
end
