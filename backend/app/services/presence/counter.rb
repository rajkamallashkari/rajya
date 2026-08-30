# Ephemeral per-account connection counter (TARGET §3). TTL is the drift
# backstop when a process dies before unsubscribed fires.
module Presence
  class Counter
    class << self
      def increment(account_id)
        change(account_id, 1)
      end

      def decrement(account_id)
        [ change(account_id, -1), 0 ].max
      end

      def online?(account_id)
        read(account_id).positive?
      end

      def read(account_id)
        Rails.cache.read(cache_key(account_id)).to_i
      end

      private

      def change(account_id, delta)
        ttl = Settings.fetch(:presence_ttl).seconds
        key = cache_key(account_id)
        count = Rails.cache.increment(key, delta, expires_in: ttl, initial: 0)
        return clamped(count) unless count.nil?

        next_count = clamped(read(account_id) + delta)
        Rails.cache.write(key, next_count, expires_in: ttl)
        next_count
      rescue StandardError => error
        Rails.logger.warn("[Presence::Counter] #{error.class}: #{error.message}")
        0
      end

      def clamped(count)
        [ count.to_i, 0 ].max
      end

      def cache_key(account_id)
        "presence:account:#{account_id}"
      end
    end
  end
end
