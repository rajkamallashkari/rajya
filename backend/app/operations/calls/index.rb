module Calls
  class Index < ApplicationOperation
    def call(account:, calls:, page: 1)
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: account)

      success(Page.call(account: account, scope: calls, page: page))
    end
  end
end
