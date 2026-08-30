module Api
  module V1
    class ReportsController < ApplicationController
      def create
        authorize Report
        skip_policy_scope
        render_result(
          Reports::Create.call(
            reporter: current_account,
            subject_type: params[:subject_type],
            subject_id: params[:subject_id],
            reason: params[:reason],
            details: params[:details]
          ),
          serializer: ReportResource, status: :created
        )
      end

      def reasons
        authorize Report
        skip_policy_scope
        render_result(Reports::Reasons.call, serializer: ReportReasonListResource)
      end
    end
  end
end
