module Api
  module V1
    class PhoneVerificationsController < ApplicationController
      def create
        authorize PhoneVerificationRequest, policy_class: PhoneVerificationPolicy
        skip_policy_scope
        render_result(PhoneVerifications::Issue.call(user: current_user),
                      serializer: PhoneVerificationResource)
      end

      def show
        authorize PhoneVerificationRequest, policy_class: PhoneVerificationPolicy
        skip_policy_scope
        render_result(PhoneVerifications::Show.call(user: current_user),
                      serializer: PhoneVerificationResource)
      end
    end
  end
end
