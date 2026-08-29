# JWT encode/decode (legacy JwtService, renamed claims). `sub` is the human
# `users.id`; `account_id` is the participant they act as; `credentials_epoch`
# is the blunt all-device revocation counter (SCHEMA §2). Individual `jti`
# revocation is session 2.5. Decode does not consult the database — epoch
# matching lives in Auth::Identity so HTTP and Cable share one check (F-6).
module Auth
  class Token
    ALGORITHM = "HS256"

    DecodeError = Class.new(StandardError)
    ExpiredError = Class.new(DecodeError)

    class << self
      def encode(user)
        payload = {
          sub: user.id,
          account_id: user.account_id,
          credentials_epoch: user.credentials_epoch,
          iat: Time.current.to_i,
          exp: Settings.fetch(:session_lifetime).seconds.from_now.to_i
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
