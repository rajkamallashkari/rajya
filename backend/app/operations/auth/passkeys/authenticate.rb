module Auth
  module Passkeys
    class Authenticate < Auth::Operation
      def call(credential:, nonce:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged
        return failure(:validation_failed) if nonce.blank? || credential.blank?

        challenge = Auth::Webauthn.take_auth_challenge(nonce)
        return failure(:validation_failed) if challenge.blank?

        passkey = Passkey.find_by(webauthn_credential_id: Auth::Webauthn.credential_id(credential))
        return failure(:unauthenticated) if passkey.nil?

        verify_and_touch!(passkey, credential, challenge)
      rescue ::WebAuthn::SignCountVerificationError
        failure(:unauthenticated)
      rescue ::WebAuthn::Error
        failure(:validation_failed)
      end

      private

      def verify_and_touch!(passkey, credential, challenge)
        wc = Auth::Webauthn.verify_assertion(credential, challenge, passkey)
        passkey.update!(sign_count: wc.sign_count, last_used_at: Time.current)
        signed_in(passkey.user)
      end
    end
  end
end
