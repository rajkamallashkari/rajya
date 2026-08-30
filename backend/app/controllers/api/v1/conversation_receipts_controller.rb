module Api
  module V1
    class ConversationReceiptsController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :show?
        render_result(
          Receipts::Advance.call(
            account: current_account, conversation: conversation,
            position: params[:position], kind: params[:kind]
          ),
          serializer: ConversationResource
        )
      end
    end
  end
end
