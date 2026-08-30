module MessageReminders
  class Index < ApplicationOperation
    def call(account:, message_reminders:)
      rows = message_reminders.pending.where(account: account).order(:remind_at).to_a
      success(List.new(message_reminders: rows))
    end
  end
end
