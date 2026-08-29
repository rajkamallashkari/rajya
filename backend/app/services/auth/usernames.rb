# Derives a unique accounts.username from an email local-part, matching the
# legacy User.derive_username rules (3–30 [A-Za-z0-9_.]) without putting
# those lengths in an operation (SCHEMA §8).
module Auth
  class Usernames
    SANITIZE = /[^a-zA-Z0-9_.]/
    FORMAT = /\A[a-zA-Z0-9_.]+\z/
    FALLBACK = "user"
    SUFFIX_CAP = 99

    class << self
      def from_email(email)
        min = Settings.fetch(:username_min_length)
        max = Settings.fetch(:username_max_length)
        local = email.to_s.split("@").first.to_s.gsub(SANITIZE, "")
        base = local.first(max)
        base = FALLBACK if base.blank?
        base = "#{base}_1" if base.length < min
        base = base.first(max)
        unique(base, max)
      end

      def valid_format?(username)
        min = Settings.fetch(:username_min_length)
        max = Settings.fetch(:username_max_length)
        value = username.to_s
        value.match?(FORMAT) && value.length >= min && value.length <= max
      end

      def available?(username, except_id: nil)
        valid_format?(username) && !taken?(username, except_id: except_id)
      end

      def taken?(candidate, except_id: nil)
        scope = Account.where("LOWER(username) = ?", candidate.to_s.downcase)
        scope = scope.where.not(id: except_id) if except_id
        scope.exists?
      end

      private

      def unique(base, max)
        return base unless taken?(base)

        suffix_n = 1
        loop do
          suffix = "_#{suffix_n}"
          cut = max - suffix.length
          candidate = "#{base.first(cut.positive? ? cut : 1)}#{suffix}"
          return candidate unless taken?(candidate)

          suffix_n += 1
          return "#{FALLBACK}_#{SecureRandom.hex(3)}" if suffix_n > SUFFIX_CAP
        end
      end
    end
  end
end
