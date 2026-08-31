# One job carrying a recipient list (F-19). Visible Web Push is skipped for
# silent send (NR-23), channels (BR-105), mute/DND/level, but the delivered
# watermark still advances — including when muted (Q-5). A successful push
# acceptance is the delivery signal when a notification is actually sent.
module Push
  class Fanout < ApplicationOperation
    def call(event:, payload:, recipient_account_ids:)
      data = payload.to_h
      accept_delivery!(event.to_s, data, Array(recipient_account_ids))
      success(
        event: event.to_s,
        payload: data,
        recipient_account_ids: Array(recipient_account_ids)
      )
    end

    private

    def accept_delivery!(event, payload, recipient_account_ids)
      return unless event == "message_created"

      message = Message.find_by(id: payload["message_id"] || payload[:message_id])
      return if message.nil?

      Array(recipient_account_ids).each_slice(Settings.fetch(:fanout_batch_size)) do |batch|
        (batch - [ message.sender_account_id ]).each { |account_id| deliver_to(message, account_id) }
      end
    end

    def deliver_to(message, account_id)
      account = Account.find_by(id: account_id)
      return if account.nil? || account.user.nil?

      resolution = Notifications::Resolve.call(
        account: account, conversation: message.conversation, message: message
      )
      if message.silent || !resolution.success? || !resolution.value.notify
        mark_delivered!(account, message)
        return
      end

      payload = Payload.for_message(account: account, message: message, settings: resolution.value.settings)
      mark_delivered!(account, message) if DeliveryChannel.deliver(account: account, payload: payload)
    end

    def mark_delivered!(account, message)
      Receipts::Advance.call(
        account: account, conversation: message.conversation, position: message.position, kind: "delivered"
      )
    end
  end
end
