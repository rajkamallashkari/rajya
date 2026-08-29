# Cached set of revoked JWT ids (SCHEMA §12.10). The set is small and changes
# rarely. A cache failure denies rather than allows — fail closed (NR-44).
module Auth
  class RevokedJtis
    CACHE_KEY = "rajya/auth/revoked_jtis"

    class << self
      def blocked?(jti)
        return true if jti.blank?

        read_set.include?(jti.to_s)
      rescue StandardError
        true
      end

      def add(jtis)
        values = Array(jtis).map(&:to_s)
        return if values.empty?

        cached = Rails.cache.read(CACHE_KEY)
        if cached
          Rails.cache.write(CACHE_KEY, (Array(cached) + values).uniq)
        else
          Rails.cache.delete(CACHE_KEY)
        end
      rescue StandardError
        Rails.cache.delete(CACHE_KEY)
      end

      def read_set
        Array(Rails.cache.fetch(CACHE_KEY) { ::Session.where.not(revoked_at: nil).pluck(:jti).map(&:to_s) }).to_set
      end
    end
  end
end
