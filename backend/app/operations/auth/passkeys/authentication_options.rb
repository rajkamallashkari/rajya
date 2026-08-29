module Auth
  module Passkeys
    class AuthenticationOptions < Auth::Operation
      def call(email:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged

        user = lookup(email)
        allow = user ? user.passkeys.pluck(:webauthn_credential_id) : []
        success(Auth::Webauthn.authentication_options(allow_credentials: allow))
      end

      private

      def lookup(email)
        normalized = Emails.normalize(email)
        normalized.present? ? User.find_by(email: normalized) : nil
      end
    end
  end
end
