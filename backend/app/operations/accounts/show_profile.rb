module Accounts
  class ShowProfile < ApplicationOperation
    Profile = Struct.new(:account, :blocked_by_viewer, keyword_init: true)

    def call(viewer:, account_id:)
      account = Account.find_by(id: account_id)
      return failure(:not_found) if account.nil? || account.deactivated?
      return failure(:not_found) if account.blocks_initiated.exists?(blocked_account_id: viewer.id)

      blocked_by_viewer = viewer.blocks_initiated.exists?(blocked_account_id: account.id)
      success(Profile.new(account:, blocked_by_viewer:))
    end
  end
end
