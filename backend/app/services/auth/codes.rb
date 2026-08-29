# OTP and token secrets for verification_codes (F-23: SecureRandom, never rand).
# OTP rows use bcrypt so verify is slow; magic-link / reset rows use SHA-256 so
# the emailed token can be looked up by digest. Both share purpose `login` in
# SCHEMA §2 — digest format is the discriminator.
module Auth
  class Codes
    BCRYPT_PREFIX = "$2"
    TOKEN_BYTES = 32
    OTP_BASE = 10
    DUMMY_SECRET = "rajya-dummy-secret"

    class << self
      def issue_otp!(user:, purpose:, destination:)
        consume_active!(user, purpose)
        raw = generate_otp
        record = user.verification_codes.create!(
          purpose: purpose,
          channel: "email",
          destination: destination,
          code_digest: BCrypt::Password.create(raw),
          expires_at: Settings.fetch(:otp_expiry).seconds.from_now
        )
        [ record, raw ]
      end

      def issue_token!(user:, purpose:, destination:, ttl_key:)
        consume_active!(user, purpose)
        raw = SecureRandom.urlsafe_base64(TOKEN_BYTES)
        record = user.verification_codes.create!(
          purpose: purpose,
          channel: "email",
          destination: destination,
          code_digest: Digest::SHA256.hexdigest(raw),
          expires_at: Settings.fetch(ttl_key).seconds.from_now
        )
        [ record, raw ]
      end

      def verify_otp(user:, purpose:, code:)
        return dummy_reject(code) if user.nil?

        cred = user.verification_codes.active.otp.where(purpose: purpose).order(created_at: :desc).first
        return dummy_reject(code) if cred.nil?
        return dummy_reject(code) if cred.attempts >= Settings.fetch(:rate_limit_otp_verification)

        unless bcrypt_match?(cred.code_digest, code)
          cred.record_attempt!
          return
        end

        cred.consume!
        cred
      end

      def verify_token(purpose:, raw_token:)
        digest = Digest::SHA256.hexdigest(raw_token.to_s)
        cred = VerificationCode.find_by(purpose: purpose, code_digest: digest)
        return if cred.nil? || cred.consumed? || cred.expired?

        cred.consume!
        cred
      end

      def dummy_work
        BCrypt::Password.create(DUMMY_SECRET)
      end

      def dummy_match(secret)
        BCrypt::Password.new(dummy_digest) == secret.to_s
      end

      def generate_otp
        length = Settings.fetch(:otp_length)
        SecureRandom.random_number(OTP_BASE**length).to_s.rjust(length, "0")
      end

      private

      def consume_active!(user, purpose)
        user.verification_codes.active.where(purpose: purpose).find_each(&:consume!)
      end

      def bcrypt_match?(digest, code)
        return false unless digest.to_s.start_with?(BCRYPT_PREFIX)

        BCrypt::Password.new(digest) == code.to_s
      rescue BCrypt::Errors::InvalidHash
        false
      end

      def dummy_reject(code)
        dummy_match(code)
        nil
      end

      def dummy_digest
        @dummy_digest ||= BCrypt::Password.create(DUMMY_SECRET).to_s
      end
    end
  end
end
