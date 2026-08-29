module Auth
  module Passwords
    class Verify < Auth::Operation
      def call(user:, password:)
        if user.password_digest.present? && user.authenticate(password.to_s)
          success(true)
        else
          failure(:unauthenticated)
        end
      end
    end
  end
end
