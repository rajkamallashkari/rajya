module ScheduledMessages
  class DispatchDueJob < ApplicationJob
    queue_as :default

    def perform
      DispatchDue.call
    end
  end
end
