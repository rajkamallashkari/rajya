module Admin
  module AuditEvents
    List = Struct.new(:audit_events, keyword_init: true)

    class Index < ApplicationOperation
      def call(admin:, admin_user_id: nil, impersonated_account_id: nil, action: nil)
        return failure(:forbidden) unless admin.is_admin?

        success(
          List.new(
            audit_events: Admin::AuditEventsQuery.call(
              admin_user_id: admin_user_id,
              impersonated_account_id: impersonated_account_id,
              action: action
            )
          )
        )
      end
    end
  end
end
