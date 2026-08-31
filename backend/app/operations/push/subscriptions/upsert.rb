module Push
  module Subscriptions
    class Upsert < ApplicationOperation
      def call(user:, endpoint:, p256dh:, auth:)
        return failure(:forbidden) if user.blank?
        return failure(:validation_failed) if [ endpoint, p256dh, auth ].any?(&:blank?)

        row = WebPushSubscription.find_or_initialize_by(user: user, endpoint: endpoint.to_s)
        row.assign_attributes(p256dh: p256dh.to_s, auth: auth.to_s)
        row.save!
        success(row)
      rescue ActiveRecord::RecordInvalid
        failure(:validation_failed)
      end
    end
  end
end
