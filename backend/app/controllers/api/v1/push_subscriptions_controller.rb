module Api
  module V1
    class PushSubscriptionsController < ApplicationController
      def vapid
        authorize WebPushSubscription, :vapid?
        skip_policy_scope
        render_result(Push::VapidPublicKey.call, serializer: VapidKeyResource)
      end

      def create
        authorize WebPushSubscription
        skip_policy_scope
        keys = subscription_keys
        render_result(
          Push::Subscriptions::Upsert.call(
            user: current_account.user, endpoint: keys[:endpoint], p256dh: keys[:p256dh], auth: keys[:auth]
          ),
          serializer: WebPushSubscriptionResource,
          status: :created
        )
      end

      def destroy
        authorize WebPushSubscription
        skip_policy_scope
        render_result(
          Push::Subscriptions::Destroy.call(user: current_account.user, endpoint: params[:endpoint]),
          serializer: OkResource
        )
      end

      private

      def subscription_keys
        raw = params[:subscription].presence || params
        keys = raw[:keys] || raw
        { endpoint: raw[:endpoint], p256dh: keys[:p256dh], auth: keys[:auth] }
      end
    end
  end
end
