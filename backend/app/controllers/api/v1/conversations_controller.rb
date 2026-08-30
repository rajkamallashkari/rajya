module Api
  module V1
    class ConversationsController < ApplicationController
      def index
        authorize Conversation
        render_result(
          Conversations::Index.call(
            account: current_account,
            conversations: policy_scope(Conversation),
            archived: ActiveModel::Type::Boolean.new.cast(params[:archived])
          ),
          serializer: ConversationListResource
        )
      end

      def show
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation
        render_result(
          Conversations::Show.call(account: current_account, conversation: conversation, clear_unread: true),
          serializer: ConversationResource
        )
      end

      def create
        authorize Conversation
        skip_policy_scope
        render_result(
          Conversations::Create.call(creator: current_account, **create_params),
          serializer: ConversationResource,
          status: :created
        )
      end

      def update
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation
        render_result(
          Conversations::Update.call(account: current_account, conversation: conversation, **update_params),
          serializer: ConversationResource
        )
      end

      private

      def create_params
        {
          kind: params[:kind],
          account_id: params[:account_id],
          account_ids: params[:account_ids],
          title: params[:title],
          description: params[:description]
        }
      end

      def update_params
        attrs = {}
        attrs[:title] = params[:title] if params.key?(:title)
        attrs[:description] = params[:description] if params.key?(:description)
        attrs[:member_permissions] = params[:member_permissions] if params.key?(:member_permissions)
        attrs[:slow_mode_seconds] = params[:slow_mode_seconds] if params.key?(:slow_mode_seconds)
        attrs[:restrict_forwarding] = params[:restrict_forwarding] if params.key?(:restrict_forwarding)
        attrs
      end
    end
  end
end
