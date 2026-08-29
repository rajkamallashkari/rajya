module Auth
  module Passwords
    class Forgot < Auth::Operation
      def call(email:)
        flagged = require_flag!(:email_password_auth)
        return flagged if flagged

        email = Emails.normalize(email)
        user = email.present? ? User.find_by(email: email) : nil
        if user
          _record, raw = Codes.issue_token!(
            user: user,
            purpose: "password_reset",
            destination: user.email,
            ttl_key: :password_reset_ttl
          )
          AuthMailer.password_reset(user: user, token: raw).deliver_now
        else
          Codes.dummy_work
        end

        success(Accepted.new(true))
      end
    end
  end
end
