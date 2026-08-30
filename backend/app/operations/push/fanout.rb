# One job carrying a recipient list (F-19). Successful acceptance advances
# the delivered watermark even when the conversation is muted (Q-5). Real
# Web Push delivery is P10.2; this is the test-double seam.
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

      (recipient_account_ids - [ message.sender_account_id ]).each do |account_id|
        account = Account.find_by(id: account_id)
        next if account.nil?

        Receipts::Advance.call(
          account: account, conversation: message.conversation, position: message.position, kind: "delivered"
        )
      end
    end
  end
end
