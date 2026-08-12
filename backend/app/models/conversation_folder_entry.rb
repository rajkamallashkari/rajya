class ConversationFolderEntry < ApplicationRecord
  belongs_to :folder, class_name: "ConversationFolder", inverse_of: :conversation_folder_entries
  belongs_to :conversation

  validates :conversation_id, uniqueness: { scope: :folder_id }
end
