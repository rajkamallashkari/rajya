module Auth
  module Otp
    class Verify < Auth::Operation
      def call(email:, code:)
        flagged = require_flag!(:passwordless_auth)
        return flagged if flagged

        email = Emails.normalize(email)
        user = email.present? ? User.find_by(email: email) : nil
        cred = Codes.verify_otp(user: user, purpose: "login", code: code)
        return failure(:validation_failed) if cred.nil?

        signed_in(cred.user)
      end
    end
  end
end
