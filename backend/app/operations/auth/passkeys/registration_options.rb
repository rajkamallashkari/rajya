module Auth
  module Passkeys
    class RegistrationOptions < Auth::Operation
      def call(user:)
        flagged = require_flag!(:passkey_auth)
        return flagged if flagged

        success(Auth::Webauthn.registration_options(
                  user: user,
                  exclude: user.passkeys.pluck(:webauthn_credential_id)
                ))
      end
    end
  end
end
