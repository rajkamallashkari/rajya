module Api
  module V1
    class PinsController < ApplicationController
      def index
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :show?
        pins = conversation.pinned_messages
          .joins(:message)
          .where(messages: { deleted_at: nil })
          .includes(message: %i[reactions sender_account])
          .order(:created_at)
        list = PinnedMessageListResource::List.new(pins)
        render json: PinnedMessageListResource.new(list, params: serializer_params).to_h
      end

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
