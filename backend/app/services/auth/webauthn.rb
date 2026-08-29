# Thin wrapper around the webauthn gem: option generation, challenge cache,
# and assertion/attestation verify. Controllers never talk to the gem.
module Auth
  class Webauthn
    AUTH_PREFIX = "webauthn_auth"
    REG_PREFIX = "webauthn_reg"
    LOCK_PREFIX = "webauthn_lock"
    MS_PER_SECOND = 1_000

    class << self
      def authentication_options(allow_credentials:)
        options = ::WebAuthn::Credential.options_for_get(
          allow: allow_credentials,
          user_verification: "preferred",
          timeout: timeout_ms
        )
        nonce = SecureRandom.uuid
        write("#{AUTH_PREFIX}:#{nonce}", options.challenge)
        options.as_json.merge(nonce: nonce)
      end

      def registration_options(user:, exclude:)
        options = ::WebAuthn::Credential.options_for_create(
          user: {
            id: ensure_handle!(user),
            name: user.email.presence || user.account.username,
            display_name: user.account.display_name
          },
          exclude: exclude,
          authenticator_selection: { user_verification: "preferred", resident_key: "preferred" },
          timeout: timeout_ms
        )
        write("#{REG_PREFIX}:#{user.id}", options.challenge)
        options.as_json
      end

      def lock_options(user_id:, allow_credentials:)
        options = ::WebAuthn::Credential.options_for_get(
          allow: allow_credentials,
          user_verification: "required",
          timeout: timeout_ms
        )
        write("#{LOCK_PREFIX}:#{user_id}", options.challenge)
        options.as_json
      end

      def take_auth_challenge(nonce)
        take("#{AUTH_PREFIX}:#{nonce}")
      end

      def take_registration_challenge(user_id)
        take("#{REG_PREFIX}:#{user_id}")
      end

      def take_lock_challenge(user_id)
        take("#{LOCK_PREFIX}:#{user_id}")
      end

      def verify_registration(credential, challenge)
        wc = ::WebAuthn::Credential.from_create(credential_hash(credential))
        wc.verify(challenge)
        wc
      rescue NoMethodError
        raise ::WebAuthn::Error, "invalid_credential"
      end

      def verify_assertion(credential, challenge, passkey)
        wc = ::WebAuthn::Credential.from_get(credential_hash(credential))
        wc.verify(challenge, public_key: passkey.public_key, sign_count: passkey.sign_count)
        wc
      rescue NoMethodError
        raise ::WebAuthn::Error, "invalid_credential"
      end

      def credential_id(credential)
        credential_hash(credential)["id"].presence
      end

      def origin
        ::WebAuthn.configuration.allowed_origins.first
      end

      private

      def ensure_handle!(user)
        return user.webauthn_handle if user.webauthn_handle.present?

        handle = ::WebAuthn.generate_user_id
        user.update!(webauthn_handle: handle)
        handle
      end

      def timeout_ms
        Settings.fetch(:webauthn_challenge_ttl) * MS_PER_SECOND
      end

      def write(key, challenge)
        Rails.cache.write(key, challenge, expires_in: Settings.fetch(:webauthn_challenge_ttl).seconds)
      end

      def take(key)
        challenge = Rails.cache.read(key)
        Rails.cache.delete(key)
        challenge
      end

      def credential_hash(credential)
        return {} if credential.blank?

        raw = credential.respond_to?(:to_unsafe_h) ? credential.to_unsafe_h : credential.to_h
        raw.deep_stringify_keys
      end
    end
  end
end
