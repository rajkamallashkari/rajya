module Api
  module V1
    class ConversationFolderConversationsController < ApplicationController
      def create
        folder = policy_scope(ConversationFolder).find(params[:conversation_folder_id])
        authorize folder, :update?
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        render_result(
          Folders::AddConversation.call(account: current_account, folder: folder, conversation: conversation),
          serializer: ConversationFolderResource
        )
      end

      def destroy
        folder = policy_scope(ConversationFolder).find(params[:conversation_folder_id])
        authorize folder, :update?
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        render_result(
          Folders::RemoveConversation.call(account: current_account, folder: folder, conversation: conversation),
          serializer: ConversationFolderResource
        )
      end
    end
  end
end
