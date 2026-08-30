module Api
  module V1
    class ConversationInvitesController < ApplicationController
      def index
        conversation = load_conversation
        authorize conversation, :create_invite?
        render_result(Invites::Index.call(conversation: conversation), serializer: GroupInviteListResource)
      end

      def create
        conversation = load_conversation
        authorize conversation, :create_invite?
        skip_policy_scope
        render_result(
          Invites::Create.call(
            actor: current_account, conversation: conversation,
            requires_approval: params[:requires_approval], max_uses: params[:max_uses],
            expires_in_seconds: params[:expires_in_seconds]
          ),
          serializer: GroupInviteResource,
          status: :created
        )
      end

      def destroy
        conversation = load_conversation
        authorize conversation, :create_invite?
        invite = conversation.group_invites.find(params[:id])
        render_result(Invites::Destroy.call(actor: current_account, invite: invite), serializer: OkResource)
      end

      private

      def load_conversation
        policy_scope(Conversation).find(params[:conversation_id])
      end
    end
  end
end
