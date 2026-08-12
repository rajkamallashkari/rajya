class ScheduledMessage < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender_account, class_name: "Account"
  belongs_to :reply_to_message, class_name: "Message", optional: true

  validates :body, presence: true
  validates :scheduled_at, presence: true
end
