module Calls
  class ExpireStaleJob < ApplicationJob
    queue_as :default
    discard_on ActiveJob::DeserializationError

    def perform
      ExpireStale.call
    end
  end
end
