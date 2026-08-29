module Auth
  module MagicLinks
    class Verify < Auth::Operation
      def call(token:)
        flagged = require_flag!(:passwordless_auth)
        return flagged if flagged

        cred = Codes.verify_token(purpose: "login", raw_token: token)
        return failure(:validation_failed) if cred.nil?

        signed_in(cred.user)
      end
    end
  end
end
