# Per-account per-conversation throttle for `@everyone` / `@admins` (NR-35).
# Cache-backed: unlike slow mode (S-18), a restart resetting this is acceptable.
module Mentions
  class EveryoneLimiter
    def self.consume!(conversation_id:, account_id:)
      limit = Settings.fetch(:mention_everyone_limit)
      period = Settings.fetch(:mention_everyone_period)
      key = "mention_everyone:#{conversation_id}:#{account_id}"
      current = Rails.cache.read(key).to_i
      return false if current >= limit

      count = Rails.cache.increment(key, 1, expires_in: period.seconds, initial: 0)
      if count.nil?
        Rails.cache.write(key, 1, expires_in: period.seconds)
        count = 1
      end
      count <= limit
    end
  end
end
