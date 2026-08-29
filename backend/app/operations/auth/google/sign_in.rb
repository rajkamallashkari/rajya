module Auth
  module Google
    class SignIn < Auth::Operation
      def call(code:)
        return failure(:validation_failed) if code.blank?

        profile = Client.profile_from_code(code)
        return failure(:upstream_failed) unless profile.ok?

        info = profile.info
        user = User.find_by(google_subject: info["sub"])
        user ? refresh(user, info) : provision(info)
      end

      private

      def refresh(user, info)
        email = Emails.normalize(info["email"])
        attrs = {}
        attrs[:email] = email if email.present?
        attrs[:email_verified_at] = Time.current if verified?(info) && user.email_verified_at.nil?
        user.update!(attrs) if attrs.any?
        signed_in(user)
      end

      def provision(info)
        email = Emails.normalize(info["email"])
        return failure(:validation_failed) if email.blank?
        return failure(:conflict) if User.exists?(email: email)

        display_name = info["name"].presence || email.split("@").first
        user = Provisioning.create_human!(
          email: email,
          display_name: display_name,
          google_subject: info["sub"],
          email_verified: verified?(info)
        )
        signed_in(user)
      end

      def verified?(info)
        info["email_verified"] == true || info["email_verified"] == "true"
      end
    end
  end
end
