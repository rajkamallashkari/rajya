module Api
  module V1
    class ConversationMembersController < ApplicationController
      def create
        conversation = load_conversation
        authorize conversation, :add_members?
        render_result(
          Conversations::AddMembers.call(
            actor: current_account, conversation: conversation, account_ids: params[:account_ids]
          ),
          serializer: ConversationResource
        )
      end

      def destroy
        conversation = load_conversation
        authorize conversation, :remove_member?
        render_result(
          Conversations::RemoveMember.call(
            actor: current_account, conversation: conversation, account_id: params[:account_id]
          ),
          serializer: ConversationResource
        )
      end

      def promote
        mutate(:promote_admin?, Conversations::Promote)
      end

      def demote
        mutate(:demote_admin?, Conversations::Demote)
      end

      def transfer
        mutate(:transfer_ownership?, Conversations::TransferOwnership)
      end

      private

      def load_conversation
        policy_scope(Conversation).find(params[:conversation_id])
      end

      def mutate(query, operation)
        conversation = load_conversation
        authorize conversation, query
        render_result(
          operation.call(actor: current_account, conversation: conversation, account_id: params[:account_id]),
          serializer: ConversationResource
        )
      end
    end
  end
end
