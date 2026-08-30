module StorageQuotas
  class OrphanedBlobCleanupJob < ApplicationJob
    queue_as :background

    def perform
      PurgeOrphans.call
    end
  end
end
