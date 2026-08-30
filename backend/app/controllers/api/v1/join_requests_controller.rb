module Api
  module V1
    class JoinRequestsController < ApplicationController
      def index
        conversation = load_conversation
        authorize conversation, :approve_join?
        render_result(JoinRequests::Index.call(conversation: conversation), serializer: JoinRequestListResource)
      end

      def approve
        conversation = load_conversation
        authorize conversation, :approve_join?
        skip_policy_scope
        render_result(
          JoinRequests::Approve.call(actor: current_account, join_request: load_request(conversation)),
          serializer: ConversationResource
        )
      end

      def reject
        conversation = load_conversation
        authorize conversation, :approve_join?
        skip_policy_scope
        render_result(
          JoinRequests::Reject.call(actor: current_account, join_request: load_request(conversation)),
          serializer: OkResource
        )
      end

      private

      def load_conversation
        policy_scope(Conversation).find(params[:conversation_id])
      end

      def load_request(conversation)
        conversation.join_requests.find(params[:id])
      end
    end
  end
end
