class MessageReminder < ApplicationRecord
  belongs_to :account
  belongs_to :message

  scope :pending, -> { where(completed_at: nil) }
  scope :due, -> { pending.where(remind_at: ..Time.current) }

  validates :remind_at, presence: true
  validates :message_id, uniqueness: { scope: :account_id }
  validate :remind_at_must_be_future, on: :create
  validate :note_length

  def completed?
    completed_at.present?
  end

  def timezone_name
    account.preference&.timezone || Preference::DEFAULT_TIMEZONE
  end

  private

  def remind_at_must_be_future
    return if remind_at.blank? || remind_at.future?

    errors.add(:remind_at, Catalog.t("errors.models.message_reminder.not_future"))
  end

  def note_length
    return if note.blank?
    return if note.length <= Settings.fetch(:reminder_note_max_length)

    errors.add(:note, Catalog.t("errors.models.message_reminder.note_too_long",
                                count: Settings.fetch(:reminder_note_max_length)))
  end
end
