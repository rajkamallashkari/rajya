module Api
  module V1
    class ConversationLeavesController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :leave?
        render_result(
          Conversations::Leave.call(account: current_account, conversation: conversation),
          serializer: OkResource
        )
      end
    end
  end
end
