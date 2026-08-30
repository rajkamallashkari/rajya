module MessageReminders
  class Update < ApplicationOperation
    def call(reminder:, actor:, remind_at: nil, note: :unset)
      return failure(:forbidden) unless reminder.account_id == actor.id

      reminder.remind_at = parse_time(remind_at, actor) unless remind_at.nil?
      reminder.note = note unless note == :unset
      return failure(:validation_failed) if reminder.remind_at.blank?

      reminder.save!
      success(reminder)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    private

    def parse_time(value, account)
      zone = ActiveSupport::TimeZone[account.preference&.timezone || Preference::DEFAULT_TIMEZONE]
      parsed = value.is_a?(String) ? zone.parse(value) : value
      parsed&.in_time_zone
    rescue ArgumentError, TypeError, NoMethodError
      nil
    end
  end
end
