# Usable login methods spanning `users` and `passkeys` (S-10 / F-8). A table
# CHECK cannot see passkey rows, so this is the single source of the
# last-credential invariant.
module Auth
  class Credentials
    KINDS = %i[email password google passkey].freeze

    class << self
      def remaining_after(user, removing:, passkey: nil)
        leftover = []
        leftover << :email if user.email.present? && removing != :email
        leftover << :password if user.password_digest.present? && removing != :password
        leftover << :google if user.google_subject.present? && removing != :google
        leftover << :passkey if passkeys_remain?(user, removing: removing, passkey: passkey)
        leftover
      end

      def passkeys_remain?(user, removing:, passkey:)
        scope = user.passkeys
        scope = scope.where.not(id: passkey.id) if removing == :passkey && passkey
        scope.exists?
      end
    end
  end
end
