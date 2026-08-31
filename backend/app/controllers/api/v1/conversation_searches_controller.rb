module Api
  module V1
    class ConversationSearchesController < ApplicationController
      def show
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :show?
        render_result(
          Search::InConversation.call(account: current_account, conversation: conversation, query: params[:q]),
          serializer: ConversationSearchResource
        )
      end
    end
  end
end
