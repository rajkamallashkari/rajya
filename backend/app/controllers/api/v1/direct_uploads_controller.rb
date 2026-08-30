module Api
  module V1
    class DirectUploadsController < ApplicationController
      before_action :set_active_storage_url_options

      def create
        authorize :direct_upload, :create?
        render_result(
          Uploads::Create.call(
            account: current_account,
            filename: params[:filename],
            byte_size: params[:byte_size],
            checksum: params[:checksum],
            content_type: params[:content_type]
          ),
          serializer: DirectUploadResource
        )
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
