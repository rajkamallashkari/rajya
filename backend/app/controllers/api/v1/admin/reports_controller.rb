module Api
  module V1
    module Admin
      class ReportsController < ApplicationController
        def index
          authorize :report, :index?, policy_class: ::Admin::ReportPolicy
          skip_policy_scope
          render_result(
            ::Admin::Reports::Index.call(
              admin: current_user, status: params[:status],
              subject_type: params[:subject_type], max_age_hours: params[:max_age_hours]
            ),
            serializer: AdminReportListResource
          )
        end

        def show
          report = Report.find(params[:id])
          authorize report, :show?, policy_class: ::Admin::ReportPolicy
          skip_policy_scope
          render_result(::Admin::Reports::Show.call(admin: current_user, report: report),
                        serializer: AdminReportResource)
        end

        def dismiss
          mutate(::Admin::Reports::Dismiss, :dismiss?)
        end

        def warn
          mutate(::Admin::Reports::Warn, :warn?)
        end

        def remove_content
          mutate(::Admin::Reports::RemoveContent, :remove_content?)
        end

        def deactivate_account
          mutate(::Admin::Reports::DeactivateAccount, :deactivate_account?)
        end

        def pundit_user
          current_user
        end

        private

        def mutate(operation, query)
          report = Report.find(params[:id])
          authorize report, query, policy_class: ::Admin::ReportPolicy
          skip_policy_scope
          render_result(
            operation.call(admin: current_user, report: report, note: params[:note], ip: request.remote_ip),
            serializer: AdminReportResource
          )
        end
      end
    end
  end
end
