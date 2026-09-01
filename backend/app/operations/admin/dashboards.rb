module Admin
  module Dashboards
    class Show < ApplicationOperation
      def call(admin:)
        return failure(:forbidden) unless admin.is_admin?

        success(Admin::DashboardQuery.call)
      end
    end
  end
end
