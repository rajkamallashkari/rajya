module Calls
  class Show < ApplicationOperation
    def call(account:, call:)
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: account)
      return failure(:forbidden) unless call.includes_account?(account.id)

      success(Envelope.new(call: call, ice_servers: nil))
    end
  end
end
