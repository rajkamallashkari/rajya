module Api
  module V1
    module Admin
      class AuditEventsController < ApplicationController
        def index
          authorize :audit_event, :index?, policy_class: ::Admin::AuditEventPolicy
          skip_policy_scope
          render_result(
            ::Admin::AuditEvents::Index.call(
              admin: current_user,
              admin_user_id: params[:admin_user_id],
              impersonated_account_id: params[:impersonated_account_id],
              action: params[:action_name]
            ),
            serializer: AdminAuditEventListResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
