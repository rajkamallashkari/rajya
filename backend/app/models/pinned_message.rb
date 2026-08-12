class PinnedMessage < ApplicationRecord
  belongs_to :conversation
  belongs_to :message
  belongs_to :pinned_by_account, class_name: "Account", inverse_of: :pinned_messages

  validates :message_id, uniqueness: { scope: :conversation_id }
end
