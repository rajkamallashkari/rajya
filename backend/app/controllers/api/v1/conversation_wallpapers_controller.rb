module Api
  module V1
    class ConversationWallpapersController < ApplicationController
      def update
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :organize?
        render_result(
          Conversations::UpdateWallpaper.call(
            account: current_account, conversation: conversation, wallpaper: wallpaper_param
          ),
          serializer: ConversationResource
        )
      end

      private

      def wallpaper_param
        raw = params[:wallpaper]
        return if raw.nil?

        raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
      end
    end
  end
end
