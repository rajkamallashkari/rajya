module Api
  module V1
    class ConversationFoldersController < ApplicationController
      def index
        authorize ConversationFolder
        render_result(
          Folders::Index.call(account: current_account, folders: policy_scope(ConversationFolder)),
          serializer: ConversationFolderListResource
        )
      end

      def create
        authorize ConversationFolder
        skip_policy_scope
        render_result(
          Folders::Create.call(account: current_account, name: params[:name], position: params[:position]),
          serializer: ConversationFolderResource,
          status: :created
        )
      end

      def update
        folder = policy_scope(ConversationFolder).find(params[:id])
        authorize folder
        render_result(
          Folders::Update.call(folder: folder, actor: current_account, name: params[:name], position: params[:position]),
          serializer: ConversationFolderResource
        )
      end

      def destroy
        folder = policy_scope(ConversationFolder).find(params[:id])
        authorize folder
        render_result(Folders::Destroy.call(folder: folder, actor: current_account), serializer: OkResource)
      end

      def reorder
        authorize ConversationFolder
        render_result(
          Folders::Reorder.call(account: current_account, ids: params[:ids], folders: policy_scope(ConversationFolder)),
          serializer: ConversationFolderListResource
        )
      end
    end
  end
end
