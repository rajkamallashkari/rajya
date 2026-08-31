# Unified stream-cancel flag (BR-79). One cache key per generation so HTTP
# helpers and the bot-reply job cannot disagree.
module Ai
  class Cancellation
    PREFIX = "rajya/ai/cancel"

    class << self
      def request!(generation_id)
        return if generation_id.blank?

        Rails.cache.write(cache_key(generation_id), true, expires_in: Limits.cancel_ttl.seconds)
      end

      def requested?(generation_id)
        return false if generation_id.blank?

        Rails.cache.read(cache_key(generation_id)) == true
      end

      def clear!(generation_id)
        return if generation_id.blank?

        Rails.cache.delete(cache_key(generation_id))
      end

      def cache_key(generation_id)
        "#{PREFIX}/#{generation_id}"
      end
    end
  end
end
