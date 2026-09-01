module Api
  module V1
    module Admin
      class DashboardsController < ApplicationController
        def show
          authorize :dashboard, :show?, policy_class: ::Admin::DashboardPolicy
          skip_policy_scope
          render_result(::Admin::Dashboards::Show.call(admin: current_user), serializer: AdminDashboardResource)
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
