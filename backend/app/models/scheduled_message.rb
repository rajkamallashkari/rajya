class ScheduledMessage < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender_account, class_name: "Account"
  belongs_to :reply_to_message, class_name: "Message", optional: true

  scope :due, -> { where(scheduled_at: ..Time.current) }
  scope :pending, -> { where.not(scheduled_at: ..Time.current) }

  validates :body, presence: true
  validates :scheduled_at, presence: true
  validate :scheduled_at_must_be_future, on: :create

  private

  def scheduled_at_must_be_future
    return if scheduled_at.blank? || scheduled_at.future?

    errors.add(:scheduled_at, Catalog.t("errors.models.scheduled_message.not_future"))
  end
end
