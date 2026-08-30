# Ephemeral activity keys (NR-3, NR-40, TARGET §3). Never persisted — TTL is
# the only expiry, so there is no cleanup job.
module Typing
  class Store
    ACTIVITIES = %w[typing recording_audio uploading_media uploading_file].freeze

    class << self
      def write(conversation_id, account_id, activity)
        Rails.cache.write(cache_key(conversation_id, account_id), activity.to_s,
                          expires_in: Settings.fetch(:typing_key_ttl).seconds)
      rescue StandardError => error
        Rails.logger.warn("[Typing::Store] #{error.class}: #{error.message}")
        nil
      end

      def read(conversation_id, account_id)
        Rails.cache.read(cache_key(conversation_id, account_id))
      rescue StandardError => error
        Rails.logger.warn("[Typing::Store] #{error.class}: #{error.message}")
        nil
      end

      def claim_broadcast?(conversation_id, account_id)
        Rails.cache.write(
          throttle_key(conversation_id, account_id), true,
          expires_in: Settings.fetch(:typing_throttle).seconds,
          unless_exist: true
        )
      rescue StandardError => error
        Rails.logger.warn("[Typing::Store] #{error.class}: #{error.message}")
        true
      end

      def cache_key(conversation_id, account_id)
        "typing:#{conversation_id}:#{account_id}"
      end

      private

      def throttle_key(conversation_id, account_id)
        "typing:broadcast:#{conversation_id}:#{account_id}"
      end
    end
  end
end
