module Calls
  class IssueIceServers < ApplicationOperation
    def call(account:)
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: account)

      success(IceConfig.new(ice_servers: IceServers.new.credentials_for(account)))
    end
  end
end
