module Api
  module V1
    class SavedRepliesController < ApplicationController
      def index
        authorize SavedReply
        render_result(
          SavedReplies::Index.call(account: current_account, saved_replies: policy_scope(SavedReply)),
          serializer: SavedReplyListResource
        )
      end

      def create
        authorize SavedReply
        skip_policy_scope
        render_result(
          SavedReplies::Create.call(
            account: current_account, shortcut: params[:shortcut], body: params[:body],
            position: params[:position]
          ),
          serializer: SavedReplyResource,
          status: :created
        )
      end

      def update
        saved_reply = policy_scope(SavedReply).find(params[:id])
        authorize saved_reply
        render_result(
          SavedReplies::Update.call(
            saved_reply: saved_reply, actor: current_account, shortcut: params[:shortcut],
            body: params[:body], position: params[:position]
          ),
          serializer: SavedReplyResource
        )
      end

      def destroy
        saved_reply = policy_scope(SavedReply).find(params[:id])
        authorize saved_reply
        render_result(SavedReplies::Destroy.call(saved_reply: saved_reply, actor: current_account),
                      serializer: OkResource)
      end
    end
  end
end
