module ScheduledMessages
  class Dispatch < ApplicationOperation
    def call(scheduled_message:)
      result = Messages::Send.call(
        conversation: scheduled_message.conversation,
        sender: scheduled_message.sender_account,
        body: scheduled_message.body,
        client_nonce: scheduled_message.client_nonce,
        reply_to_message_id: scheduled_message.reply_to_message_id
      )
      scheduled_message.destroy!
      result
    end
  end
end
