module ScheduledMessages
  class DispatchDue < ApplicationOperation
    def call
      ScheduledMessage.due.find_each { |row| Dispatch.call(scheduled_message: row) }
      success(true)
    end
  end
end
