# Cache set of accounts currently subscribed to a conversation stream. Live
# WebSocket acceptance is delivery signal 1 (SCHEMA §5). Adapter-agnostic —
# Rails.cache, same TTL backstop as presence.
module Receipts
  class Subscribers
    class << self
      def add(conversation_id, account_id)
        mutate(conversation_id) { |set| set[account_id] = true }
      end

      def remove(conversation_id, account_id)
        mutate(conversation_id) { |set| set.delete(account_id) }
      end

      def account_ids(conversation_id)
        Hash(Rails.cache.read(cache_key(conversation_id))).keys.map(&:to_i)
      rescue StandardError => error
        Rails.logger.warn("[Receipts::Subscribers] #{error.class}: #{error.message}")
        []
      end

      private

      def mutate(conversation_id)
        key = cache_key(conversation_id)
        set = Hash(Rails.cache.read(key))
        yield set
        Rails.cache.write(key, set, expires_in: Settings.fetch(:presence_ttl).seconds)
        set
      rescue StandardError => error
        Rails.logger.warn("[Receipts::Subscribers] #{error.class}: #{error.message}")
        {}
      end

      def cache_key(conversation_id)
        "receipts:subscribers:#{conversation_id}"
      end
    end
  end
end
