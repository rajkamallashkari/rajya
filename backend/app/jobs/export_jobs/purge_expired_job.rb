module ExportJobs
  class PurgeExpiredJob < ApplicationJob
    queue_as :background

    def perform
      PurgeExpired.call
    end
  end
end
