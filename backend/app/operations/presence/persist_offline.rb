module Presence
  class PersistOffline < ApplicationOperation
    def call(account_id:)
      return success if Counter.online?(account_id)

      account = Account.find_by(id: account_id)
      return success if account.nil?

      RecordLastActive.call(account_id: account_id, force: true)
      Announce.call(account: account, online: false)
      success(account)
    end
  end
end
