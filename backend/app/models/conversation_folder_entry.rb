class ConversationFolderEntry < ApplicationRecord
  belongs_to :folder, class_name: "ConversationFolder", inverse_of: :conversation_folder_entries
  belongs_to :conversation

  validates :conversation_id, uniqueness: { scope: :folder_id }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
end
