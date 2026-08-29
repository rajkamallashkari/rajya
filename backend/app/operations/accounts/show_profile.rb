module Accounts
  class ShowProfile < ApplicationOperation
    def call(viewer:, account_id:)
      account = Account.find_by(id: account_id)
      return failure(:not_found) if account.nil? || account.deactivated?
      return failure(:not_found) if viewer.blocked_with?(account)

      success(account)
    end
  end
end
