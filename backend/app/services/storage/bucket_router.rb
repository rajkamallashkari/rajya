# Routes uploads to the lowest-priority active bucket with remaining capacity
# (BR-91). used_bytes is updated atomically after the blob is attached so a
# rolled-back send never consumes quota.
module Storage
  class BucketRouter
    class NoBucketAvailable < StandardError; end

    class << self
      def available_for(byte_size)
        bucket = StorageBucket.routable
                              .where("used_bytes + ? <= capacity_bytes", byte_size.to_i)
                              .first
        raise NoBucketAvailable unless bucket

        bucket
      end

      def record_upload!(service_name, byte_size)
        StorageBucket.where(service_name: service_name)
                     .update_all([ "used_bytes = used_bytes + ?", byte_size.to_i ])
        StorageBucket.where(service_name: service_name)
                     .where("used_bytes >= capacity_bytes")
                     .update_all(status: "full")
      end

      def record_deletion!(service_name, byte_size)
        StorageBucket.where(service_name: service_name)
                     .update_all([ "used_bytes = GREATEST(0, used_bytes - ?)", byte_size.to_i ])
        StorageBucket.where(service_name: service_name, status: "full")
                     .where("used_bytes < capacity_bytes")
                     .update_all(status: "active")
      end
    end
  end
end
