module Auth
  module Passwords
    class Change < Auth::Operation
      def call(user:, current_password:, password:, password_confirmation:)
        flagged = require_flag!(:email_password_auth)
        return flagged if flagged
        return current_password_error unless current_ok?(user, current_password)

        password_error = password_error_for(password, password_confirmation)
        return password_error if password_error

        user.password = password
        user.save!
        user.revoke_all_credentials!
        signed_in(user.reload)
      end

      private

      def current_ok?(user, current_password)
        return true if user.password_digest.blank?

        user.authenticate(current_password.to_s)
      end

      def current_password_error
        failure(:validation_failed, details: {
          current_password: [ Catalog.t("errors.models.user.current_password") ]
        })
      end

      def password_error_for(password, confirmation)
        min = Settings.fetch(:password_min_length)
        if password.to_s.length < min
          return failure(:validation_failed, details: {
            password: [ Catalog.t("errors.models.user.password_too_short", count: min) ]
          })
        end
        return if password.to_s == confirmation.to_s

        failure(:validation_failed, details: {
          password_confirmation: [ Catalog.t("errors.models.user.password_confirmation") ]
        })
      end
    end
  end
end
