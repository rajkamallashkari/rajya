module Api
  module V1
    class AttachmentsController < ApplicationController
      before_action :set_active_storage_url_options

      def download
        render_media(:original)
      end

      def thumbnail
        render_media(:thumb)
      end

      def retry
        attachment = Attachment.find(params[:id])
        authorize attachment, :retry?
        render_result(Attachments::Retry.call(attachment: attachment), serializer: AttachmentResource)
      end

      private

      def render_media(variant)
        attachment = Attachment.find(params[:id])
        authorize attachment, :show?
        render_result(
          Attachments::IssueUrl.call(attachment: attachment, variant: variant),
          serializer: MediaUrlResource
        )
      end

      def set_active_storage_url_options
        ActiveStorage::Current.url_options = {
          protocol: request.protocol, host: request.host, port: request.port
        }
      end
    end
  end
end
