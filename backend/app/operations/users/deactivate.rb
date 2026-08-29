module Users
  class Deactivate < ApplicationOperation
    def call(user:)
      account = user.account
      return success(nil) if account.deactivated?

      Account.transaction do
        account.update!(deactivated_at: Time.current)
        user.revoke_all_credentials!
      end
      success(nil)
    end
  end
end
