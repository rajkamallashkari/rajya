module Push
  module Subscriptions
    class Destroy < ApplicationOperation
      def call(user:, endpoint:)
        return failure(:forbidden) if user.blank?
        return failure(:validation_failed) if endpoint.blank?

        row = WebPushSubscription.find_by(user: user, endpoint: endpoint)
        return failure(:not_found) if row.nil?

        row.destroy!
        success(true)
      end
    end
  end
end
