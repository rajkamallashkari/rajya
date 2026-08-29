module Auth
  module Passwords
    class Reset < Auth::Operation
      def call(token:, password:, password_confirmation:)
        flagged = require_flag!(:email_password_auth)
        return flagged if flagged

        cred = Codes.verify_token(purpose: "password_reset", raw_token: token)
        return failure(:validation_failed) if cred.nil?

        min = Settings.fetch(:password_min_length)
        if password.to_s.length < min
          return failure(:validation_failed, details: {
            password: [ Catalog.t("errors.models.user.password_too_short", count: min) ]
          })
        end
        if password != password_confirmation
          return failure(:validation_failed, details: {
            password_confirmation: [ Catalog.t("errors.models.user.password_confirmation") ]
          })
        end

        user = cred.user
        user.password = password
        user.save!
        user.revoke_all_credentials!
        signed_in(user.reload)
      end
    end
  end
end
