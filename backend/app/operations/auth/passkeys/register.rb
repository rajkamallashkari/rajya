module Auth
  module Passkeys
    class Register < Auth::Operation
      def call(user:, credential:, nickname:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged
        return failure(:validation_failed) if credential.blank?

        challenge = Auth::Webauthn.take_registration_challenge(user.id)
        return failure(:validation_failed) if challenge.blank?

        persist!(user, credential, challenge, nickname)
      rescue ::WebAuthn::Error, ActiveRecord::RecordInvalid
        failure(:validation_failed)
      end

      private

      def persist!(user, credential, challenge, nickname)
        wc = Auth::Webauthn.verify_registration(credential, challenge)
        passkey = user.passkeys.create!(
          webauthn_credential_id: wc.id,
          public_key: wc.public_key,
          sign_count: wc.sign_count,
          nickname: nickname.to_s.strip.presence || Catalog.t("passkeys.default_nickname")
        )
        success(passkey)
      end
    end
  end
end
