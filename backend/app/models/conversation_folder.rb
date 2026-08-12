class ConversationFolder < ApplicationRecord
  belongs_to :account

  has_many :conversation_folder_entries, foreign_key: :folder_id, inverse_of: :folder, dependent: :destroy
  has_many :conversations, through: :conversation_folder_entries

  validates :name, presence: true
end
