module MessageReminders
  class Dispatch < ApplicationOperation
    def call(reminder:)
      return success(reminder) if reminder.completed_at.present?

      reminder.update!(completed_at: Time.current)
      Realtime.publish(
        "account:#{reminder.account_id}",
        :message_reminder,
        "message_id" => reminder.message_id, "id" => reminder.id
      )
      success(reminder.reload)
    end
  end
end
