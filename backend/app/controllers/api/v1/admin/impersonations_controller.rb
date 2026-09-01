module Api
  module V1
    module Admin
      class ImpersonationsController < ApplicationController
        def create
          account = Account.find(params[:account_id])
          authorize :impersonation, :create?, policy_class: ::Admin::ImpersonationPolicy
          skip_policy_scope
          render_result(
            ::Admin::Impersonation::Start.call(
              admin: current_user, account: account, session: current_session, ip: request.remote_ip
            ),
            serializer: SessionResource
          )
        end

        def destroy
          authorize :impersonation, :destroy?, policy_class: ::Admin::ImpersonationPolicy
          skip_policy_scope
          render_result(
            ::Admin::Impersonation::Stop.call(
              admin: current_user, impersonated_account: current_account, ip: request.remote_ip
            ),
            serializer: OkResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
