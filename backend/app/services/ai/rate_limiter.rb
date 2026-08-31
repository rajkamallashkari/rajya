# Per-account per-capability AI throttle (BR-84, F-12). A cache error denies
# rather than allows — fail closed (BR-85 changed).
module Ai
  class RateLimiter
    LIMIT_KEYS = {
      bot_reply: :ai_reply_rate_limit,
      memory_extract: :ai_rate_limit_per_capability,
      rewrite: :ai_rate_limit_rewrite,
      suggest_replies: :ai_rate_limit_suggest_replies,
      translate: :ai_rate_limit_translate,
      summarize: :ai_rate_limit_summarize,
      style_profile: :ai_rate_limit_style_profile
    }.freeze

    PERIOD_KEYS = {
      style_profile: :ai_rate_limit_style_profile_period
    }.freeze

    class << self
      def consume!(account:, capability:)
        return true if account.nil?

        limit = Settings.fetch(limit_key(capability))
        period = Settings.fetch(period_key(capability))
        key = cache_key(account.id, capability)
        current = Rails.cache.read(key).to_i
        return false if current >= limit

        count = Rails.cache.increment(key, 1, expires_in: period.seconds, initial: 0)
        if count.nil?
          Rails.cache.write(key, 1, expires_in: period.seconds)
          count = 1
        end
        count <= limit
      rescue StandardError
        false
      end

      def limit_for(capability)
        Settings.fetch(limit_key(capability))
      end

      def cache_key(account_id, capability)
        "rajya/ai/rl/#{account_id}/#{capability}"
      end

      private

      def limit_key(capability)
        LIMIT_KEYS.fetch(capability.to_sym, :ai_rate_limit_per_capability)
      end

      def period_key(capability)
        PERIOD_KEYS.fetch(capability.to_sym, :ai_rate_limit_period)
      end
    end
  end
end
