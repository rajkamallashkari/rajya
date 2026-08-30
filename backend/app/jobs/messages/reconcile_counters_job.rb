module Messages
  class ReconcileCountersJob < ApplicationJob
    queue_as :background

    def perform(message_id = nil)
      ReconcileCounters.call(message: message_id && Message.find_by(id: message_id))
    end
  end
end
