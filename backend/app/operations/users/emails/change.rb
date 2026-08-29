module Users
  module Emails
    class Change < ApplicationOperation
      def call(user:, email:)
        address = Auth::Emails.normalize(email)
        return email_blank if address.blank?
        return email_unchanged if address == Auth::Emails.normalize(user.email)
        return email_taken if User.where.not(id: user.id).exists?(email: address)

        _record, raw = Auth::Codes.issue_otp!(user: user, purpose: "email_change", destination: address)
        AuthMailer.email_change(user: user, new_email: address, otp: raw).deliver_now
        success(Auth::Accepted.new(true))
      end

      private

      def email_blank
        failure(:validation_failed, details: { email: [ Catalog.t("errors.models.user.email_blank") ] })
      end

      def email_unchanged
        failure(:validation_failed, details: { email: [ Catalog.t("errors.models.user.email_unchanged") ] })
      end

      def email_taken
        failure(:validation_failed, details: { email: [ Catalog.t("errors.models.user.email_taken") ] })
      end
    end
  end
end
