module Auth
  module Otp
    class Request < Auth::Operation
      def call(email:)
        flagged = require_flag!(:passwordless_auth)
        return flagged if flagged

        email = Emails.normalize(email)
        user = email.present? ? User.find_by(email: email) : nil
        if user
          _record, raw = Codes.issue_otp!(user: user, purpose: "login", destination: user.email)
          AuthMailer.email_otp(user: user, otp: raw).deliver_now
        else
          Codes.dummy_work
        end

        success(Accepted.new(true))
      end
    end
  end
end
