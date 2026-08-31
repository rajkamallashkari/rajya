module Calls
  class CancelOnDisconnect < ApplicationOperation
    def call(account:)
      call = Call.current_for(account.id)
      return success if call.nil? || call.status != "ringing" || call.initiator_account_id != account.id

      Cancel.call(account: account, call: call)
    end
  end
end
