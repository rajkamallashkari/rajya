module Auth
  class Operation < ApplicationOperation
    private

    def signed_in(user)
      return failure(:unauthenticated) if user.nil? || user.account.deactivated?

      success(Session.issue(user))
    end

    def require_flag!(key)
      FeatureFlag.enabled?(key) ? nil : failure(:not_found)
    end
  end
end
