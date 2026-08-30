module Api
  module V1
    class PinsController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :pin?
        message = conversation.messages.find(params[:message_id])
        render_result(Messages::Pin.call(message: message, actor: current_account),
                      serializer: PinnedMessageResource, status: :created)
      end

      def destroy
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :pin?
        message = conversation.messages.find(params[:message_id])
        render_result(Messages::Unpin.call(message: message, actor: current_account), serializer: OkResource)
      end
    end
  end
end
