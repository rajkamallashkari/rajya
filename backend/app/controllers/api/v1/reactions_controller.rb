module Api
  module V1
    class ReactionsController < ApplicationController
      def index
        message = policy_scope(Message).find(params[:message_id])
        authorize message, :show?
        render_result(Messages::ReactionDetails.call(message: message), serializer: ReactionDetailsResource)
      end

      def create
        message = policy_scope(Message).find(params[:message_id])
        authorize message, :react?
        render_result(Messages::React.call(message: message, actor: current_account, emoji: params[:emoji]),
                      serializer: MessageResource, status: :created)
      end

      def destroy
        message = policy_scope(Message).find(params[:message_id])
        authorize message, :react?
        render_result(Messages::Unreact.call(message: message, actor: current_account, emoji: params[:emoji]),
                      serializer: MessageResource)
      end
    end
  end
end
