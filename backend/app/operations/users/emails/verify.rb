module Users
  module Emails
    class Verify < ApplicationOperation
      def call(user:, code:)
        cred = Auth::Codes.verify_otp(user: user, purpose: "email_change", code: code)
        return failure(:validation_failed) if cred.nil?

        address = Auth::Emails.normalize(cred.destination)
        return email_taken if User.where.not(id: user.id).exists?(email: address)

        user.update!(email: address, email_verified_at: Time.current)
        success(Users::Me.new(account: user.account, user: user.reload))
      end

      private

      def email_taken
        failure(:validation_failed, details: { email: [ Catalog.t("errors.models.user.email_taken") ] })
      end
    end
  end
end
