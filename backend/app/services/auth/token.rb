# JWT encode/decode (legacy JwtService, renamed claims). `sub` is the human
# `users.id`; `account_id` is the participant they act as; `credentials_epoch`
# is the blunt all-device revocation counter (SCHEMA §2 / S-20). `jti` is the
# per-token handle for individual device revocation (NR-44). Decode does not
# consult the database — epoch and `jti` matching live in Auth::Identity so
# HTTP and Cable share one check (F-6).
module Auth
  class Token
    ALGORITHM = "HS256"

    DecodeError = Class.new(StandardError)
    ExpiredError = Class.new(DecodeError)

    class << self
      def encode(user, jti:, expires_at: nil)
        exp = expires_at || Settings.fetch(:session_lifetime).seconds.from_now
        payload = {
          sub: user.id,
          account_id: user.account_id,
          credentials_epoch: user.credentials_epoch,
          jti: jti.to_s,
          iat: Time.current.to_i,
          exp: exp.to_i
        }
        JWT.encode(payload, secret, ALGORITHM)
      end

      def decode(token)
        payload, = JWT.decode(token, secret, true, { algorithm: ALGORITHM })
        payload
      rescue JWT::ExpiredSignature => error
        raise ExpiredError, error.message
      rescue JWT::DecodeError => error
        raise DecodeError, error.message
      end

      private

      def secret
        ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
      end
    end
  end
end
