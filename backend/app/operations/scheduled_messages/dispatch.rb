module ScheduledMessages
  class Dispatch < ApplicationOperation
    def call(scheduled_message:)
      result = Messages::Send.call(
        conversation: scheduled_message.conversation,
        sender: scheduled_message.sender_account,
        body: scheduled_message.body,
        client_nonce: send_nonce(scheduled_message),
        reply_to_message_id: scheduled_message.reply_to_message_id,
        silent: false
      )
      advance_or_destroy!(scheduled_message, result)
      result
    end

    private

    def send_nonce(row)
      return if row.recurring? && row.occurrences_sent.positive?

      row.client_nonce
    end

    def advance_or_destroy!(row, result)
      return row.destroy! unless result.success? && row.recurring?

      sent = row.occurrences_sent + 1
      parsed = row.parsed_recurrence
      zone = ActiveSupport::TimeZone[row.timezone_name] || Time.zone
      next_at = Recurrence::Rrule.next_after(
        parsed, after: Time.current, zone: zone, dtstart: row.scheduled_at
      )
      if Recurrence::Rrule.complete?(parsed, occurrences_sent: sent, next_at: next_at)
        row.destroy!
      else
        row.update!(
          occurrences_sent: sent,
          last_run_at: Time.current,
          next_run_at: next_at,
          client_nonce: nil
        )
      end
    end
  end
end
