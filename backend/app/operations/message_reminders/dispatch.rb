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
      deliver_push(reminder)
      success(reminder.reload)
    end

    private

    def deliver_push(reminder)
      account = reminder.account
      return if account.user.nil?

      Push::DeliveryChannel.deliver(account: account, payload: Push::Payload.for_reminder(reminder: reminder))
    end
  end
end
