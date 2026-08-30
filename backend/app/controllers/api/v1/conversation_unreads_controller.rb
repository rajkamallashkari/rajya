module Api
  module V1
    class ConversationUnreadsController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :organize?
        render_result(Conversations::MarkUnread.call(account: current_account, conversation: conversation),
                      serializer: ConversationResource)
      end

      def destroy
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :organize?
        render_result(Conversations::MarkRead.call(account: current_account, conversation: conversation),
                      serializer: ConversationResource)
      end
    end
  end
end
