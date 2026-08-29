module Sessions
  class RevokeOthers < ApplicationOperation
    def call(user:, current_jti:)
      ::Session.revoke_all_for!(user, except_jti: current_jti)
      success(nil)
    end
  end
end
