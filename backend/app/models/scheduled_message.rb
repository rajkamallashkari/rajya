class ScheduledMessage < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender_account, class_name: "Account"
  belongs_to :reply_to_message, class_name: "Message", optional: true

  scope :due, lambda {
    now = Time.current
    where(recurrence_rule: nil, scheduled_at: ..now)
      .or(where.not(recurrence_rule: nil).where(next_run_at: ..now))
  }
  scope :pending, lambda {
    now = Time.current
    one_shot = where(recurrence_rule: nil).where(arel_table[:scheduled_at].gt(now))
    recurring = where.not(recurrence_rule: nil).where(
      arel_table[:next_run_at].eq(nil).or(arel_table[:next_run_at].gt(now))
    )
    one_shot.or(recurring)
  }

  validates :body, presence: true
  validates :scheduled_at, presence: true
  validate :scheduled_at_must_be_future, on: :create
  validate :recurrence_must_be_subset

  def recurring?
    recurrence_rule.present?
  end

  def parsed_recurrence
    Recurrence::Rrule.parse(recurrence_rule)
  end

  def timezone_name
    sender_account.preference&.timezone || Preference::DEFAULT_TIMEZONE
  end

  private

  def scheduled_at_must_be_future
    return if scheduled_at.blank? || scheduled_at.future?

    errors.add(:scheduled_at, Catalog.t("errors.models.scheduled_message.not_future"))
  end

  def recurrence_must_be_subset
    return if recurrence_rule.blank?

    parsed = Recurrence::Rrule.parse(recurrence_rule)
    return unless parsed == :invalid

    errors.add(:recurrence_rule, Catalog.t("errors.models.scheduled_message.rrule"))
  end
end
