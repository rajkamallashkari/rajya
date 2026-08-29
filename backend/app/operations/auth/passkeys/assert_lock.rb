module Auth
  module Passkeys
    class AssertLock < Auth::Operation
      def call(user:, credential:)
        flagged = require_flag!(:app_lock)
        return flagged if flagged
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged
        return failure(:validation_failed) if credential.blank?

        challenge = Auth::Webauthn.take_lock_challenge(user.id)
        return failure(:validation_failed) if challenge.blank?

        passkey = user.passkeys.find_by(webauthn_credential_id: Auth::Webauthn.credential_id(credential))
        return failure(:unauthenticated) if passkey.nil?

        wc = Auth::Webauthn.verify_assertion(credential, challenge, passkey)
        passkey.update!(sign_count: wc.sign_count, last_used_at: Time.current)
        success(true)
      rescue ::WebAuthn::SignCountVerificationError
        failure(:unauthenticated)
      rescue ::WebAuthn::Error
        failure(:validation_failed)
      end
    end
  end
end
