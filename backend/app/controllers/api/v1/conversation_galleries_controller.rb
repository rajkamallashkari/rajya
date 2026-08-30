module Api
  module V1
    class ConversationGalleriesController < ApplicationController
      def show
        conversation = Conversation.find(params[:id])
        authorize conversation, :show?
        render_result(
          Conversations::GalleryIndex.call(
            conversation: conversation,
            kind: params[:kind].presence || "images",
            page: params[:page]
          ),
          serializer: GalleryPageResource
        )
      end
    end
  end
end
