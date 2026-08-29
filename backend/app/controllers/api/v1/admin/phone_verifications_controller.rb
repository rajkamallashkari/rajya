module Api
  module V1
    module Admin
      class PhoneVerificationsController < ApplicationController
        def create
          target = User.find(params[:user_id])
          authorize target, :verify_phone?, policy_class: ::Admin::UserPolicy
          skip_policy_scope
          render_result(
            ::PhoneVerifications::AdminVerify.call(
              admin: current_user, user: target, phone: params[:phone], ip: request.remote_ip
            ),
            serializer: MeResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
