module Monitoring
  class CapacityAlertJob < ApplicationJob
    queue_as :background

    def perform
      AlertCapacity.call
    end
  end
end
