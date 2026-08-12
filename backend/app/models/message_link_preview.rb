class MessageLinkPreview < ApplicationRecord
  belongs_to :message
  belongs_to :link_preview

  validates :link_preview_id, uniqueness: { scope: :message_id }
end
