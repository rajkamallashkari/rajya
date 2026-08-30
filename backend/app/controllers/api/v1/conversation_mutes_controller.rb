module Api
  module V1
    class ConversationMutesController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :organize?
        render_result(
          Conversations::Mute.call(account: current_account, conversation: conversation, duration: params[:duration]),
          serializer: ConversationResource
        )
      end

      def destroy
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :organize?
        render_result(Conversations::Unmute.call(account: current_account, conversation: conversation),
                      serializer: ConversationResource)
      end
    end
  end
end
