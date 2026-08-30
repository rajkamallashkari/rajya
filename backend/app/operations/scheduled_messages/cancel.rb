module ScheduledMessages
  class Cancel < ApplicationOperation
    def call(scheduled_message:, actor:)
      return failure(:forbidden) unless scheduled_message.sender_account_id == actor.id

      scheduled_message.destroy!
      success(true)
    end
  end
end
