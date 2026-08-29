module Auth
  class RemoveCredential < Auth::Operation
    def call(user:, kind:, passkey: nil)
      return failure(:validation_failed) unless Credentials::KINDS.include?(kind)
      return failure(:not_found) if kind == :passkey && (passkey.nil? || passkey.user_id != user.id)
      return failure(:conflict, details: last_credential) if Credentials.remaining_after(user, removing: kind,
                                                                                         passkey: passkey).empty?

      apply!(user, kind, passkey)
      success(user.reload)
    end

    private

    def apply!(user, kind, passkey)
      user.update!(email: nil, email_verified_at: nil) if kind == :email
      user.update!(password_digest: nil) if kind == :password
      user.update!(google_subject: nil) if kind == :google
      passkey.destroy! if kind == :passkey
    end

    def last_credential
      { credential: [ Catalog.t("errors.models.user.last_credential") ] }
    end
  end
end
