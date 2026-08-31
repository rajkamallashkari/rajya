module Api
  module V1
    class ConversationGenerationsController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :cancel_generation?
        render_result(
          Bots::Cancel.call(
            account: current_account, conversation: conversation, generation_id: params[:generation_id]
          ),
          serializer: GenerationResource
        )
      end
    end
  end
end
