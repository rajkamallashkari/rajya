module Api
  module V1
    class ConversationMessagesController < ApplicationController
      def index
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :show?
        render_result(
          Messages::Index.call(scope: policy_scope(Message).where(conversation_id: conversation.id), **cursors),
          serializer: MessagePageResource
        )
      end

      private

      def cursors
        {
          before: params[:before],
          after: params[:after],
          around_id: params[:around_id],
          around_at: params[:around_at],
          after_revision: params[:after_revision]
        }
      end
    end
  end
end
