module Api
  module V1
    class ConversationSuggestRepliesController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :suggest_replies?
        render_result(
          Ai::SuggestReplies.call(
            account: current_account, conversation: conversation, message_id: params[:message_id]
          ),
          serializer: SuggestRepliesResource
        )
      end
    end
  end
end
