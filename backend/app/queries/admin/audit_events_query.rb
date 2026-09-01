module Admin
  class AuditEventsQuery < ApplicationQuery
    def initialize(admin_user_id: nil, impersonated_account_id: nil, action: nil)
      @admin_user_id = admin_user_id
      @impersonated_account_id = impersonated_account_id
      @action = action
    end

    def call
      scope = AuditEvent.includes(:admin_user, :impersonated_account).order(created_at: :desc)
      scope = scope.where(admin_user_id: @admin_user_id) if @admin_user_id.present?
      scope = scope.where(impersonated_account_id: @impersonated_account_id) if @impersonated_account_id.present?
      scope = scope.where(action: @action) if @action.present?
      scope.limit(::Settings.fetch(:search_page_size)).to_a
    end
  end
end
