class MessageContact < ApplicationRecord
  self.record_timestamps = false

  belongs_to :message
  belongs_to :contact_account, class_name: "Account", optional: true

  validates :display_name, presence: true
  validates :position, presence: true
end
