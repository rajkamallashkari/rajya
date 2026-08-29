module Auth
  module Passwords
    class Login < Auth::Operation
      def call(email:, password:)
        flagged = require_flag!(:email_password_auth)
        return flagged if flagged

        email = Emails.normalize(email)
        user = email.present? ? User.find_by(email: email) : nil
        authenticated = authenticate(user, password)
        return failure(:unauthenticated) unless authenticated

        signed_in(user)
      end

      private

      def authenticate(user, password)
        if user&.password_digest.present?
          user.authenticate(password)
        else
          Codes.dummy_match(password)
          false
        end
      end
    end
  end
end
