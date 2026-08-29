module Auth
  module Passwords
    class Register < Auth::Operation
      def call(email:, name:, password:, password_confirmation:)
        flagged = require_flag!(:email_password_auth)
        return flagged if flagged

        email = Emails.normalize(email)
        name = name.to_s.strip.presence
        return failure(:validation_failed, details: email_blank) if email.blank?
        return failure(:validation_failed, details: name_blank) if name.blank?
        return failure(:conflict, details: email_taken) if User.exists?(email: email)

        password_error = password_error_for(password, password_confirmation)
        return password_error if password_error

        user = Provisioning.create_human!(email: email, display_name: name, password: password)
        signed_in(user)
      end

      private

      def password_error_for(password, confirmation)
        min = Settings.fetch(:password_min_length)
        if password.to_s.length < min
          return failure(:validation_failed, details: {
            password: [ Catalog.t("errors.models.user.password_too_short", count: min) ]
          })
        end
        return if password == confirmation

        failure(:validation_failed, details: {
          password_confirmation: [ Catalog.t("errors.models.user.password_confirmation") ]
        })
      end

      def email_blank
        { email: [ Catalog.t("errors.models.user.email_blank") ] }
      end

      def name_blank
        { name: [ Catalog.t("errors.models.user.name_blank") ] }
      end

      def email_taken
        { email: [ Catalog.t("errors.models.user.email_taken") ] }
      end
    end
  end
end
