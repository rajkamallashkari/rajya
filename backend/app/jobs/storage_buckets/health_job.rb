module StorageBuckets
  class HealthJob < ApplicationJob
    queue_as :background

    def perform(bucket_id = nil)
      CheckHealth.call(bucket: bucket_id && StorageBucket.find_by(id: bucket_id))
    end
  end
end
