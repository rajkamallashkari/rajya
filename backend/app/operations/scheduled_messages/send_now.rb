module ScheduledMessages
  class SendNow < ApplicationOperation
    def call(scheduled_message:, actor:)
      return failure(:forbidden) unless scheduled_message.sender_account_id == actor.id

      Dispatch.call(scheduled_message: scheduled_message)
    end
  end
end
