module Calls
  class Active < ApplicationOperation
    def call(account:)
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: account)

      ExpireStale.call
      success(Envelope.new(call: Call.current_for(account.id), ice_servers: nil))
    end
  end
end
