module Api
  module V1
    class ExportJobsController < ApplicationController
      before_action :set_active_storage_url_options

      def index
        authorize ExportJob
        render_result(
          ExportJobs::Index.call(account: current_account, jobs: policy_scope(ExportJob)),
          serializer: ExportJobListResource
        )
      end

      def create
        if params[:conversation_id].present?
          authorize Conversation.find(params[:conversation_id]), :show?
        else
          authorize ExportJob
        end
        skip_policy_scope
        render_result(
          ExportJobs::Create.call(
            account: current_account, conversation_id: params[:conversation_id],
            format: params[:format], include_media: params[:include_media]
          ),
          serializer: ExportJobResource,
          status: :created
        )
      end

      def show
        job = ExportJob.find(params[:id])
        authorize job
        render_result(ExportJobs::Show.call(job: job), serializer: ExportJobResource)
      end

      def download
        job = ExportJob.find(params[:id])
        authorize job, :download?
        render_result(ExportJobs::IssueUrl.call(job: job), serializer: MediaUrlResource)
      end

      private

      def set_active_storage_url_options
        ActiveStorage::Current.url_options = {
          protocol: request.protocol, host: request.host, port: request.port
        }
      end
    end
  end
end
