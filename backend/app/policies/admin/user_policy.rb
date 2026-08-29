# Admin endpoints authorize the authenticating human (`current_user`), not
# `current_account` — admin is a User flag, and during impersonation the
# acting account is the impersonated participant (CONVENTIONS.md §2.4).
module Admin
  class UserPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def verify_phone?
      user.is_admin?
    end
  end
end
