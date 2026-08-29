module Auth
  module Passkeys
    class LockOptions < Auth::Operation
      def call(user:)
        flagged = require_flag!(:app_lock)
        return flagged if flagged

        success(Auth::Webauthn.lock_options(
                  user_id: user.id,
                  allow_credentials: user.passkeys.pluck(:webauthn_credential_id)
                ))
      end
    end
  end
end
