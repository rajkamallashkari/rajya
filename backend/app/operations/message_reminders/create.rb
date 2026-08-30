module MessageReminders
  class Create < ApplicationOperation
    def call(account:, message:, remind_at:, note: nil)
      return failure(:not_found) unless MessagePolicy.new(account, message).show?
      at = parse_time(remind_at, account)
      return failure(:validation_failed) unless at&.future?

      existing = MessageReminder.find_by(account: account, message: message)
      if existing
        existing.assign_attributes(remind_at: at, note: note.presence, completed_at: nil)
        return persist(existing)
      end

      persist(MessageReminder.new(account: account, message: message, remind_at: at, note: note.presence))
    end

    private

    def persist(row)
      row.save!
      success(row)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    def parse_time(value, account)
      zone = ActiveSupport::TimeZone[account.preference&.timezone || Preference::DEFAULT_TIMEZONE]
      parsed = value.is_a?(String) ? zone.parse(value) : value
      parsed&.in_time_zone
    rescue ArgumentError, TypeError, NoMethodError
      nil
    end
  end
end
