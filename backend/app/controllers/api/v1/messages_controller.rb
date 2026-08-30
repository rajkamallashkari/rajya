module Api
  module V1
    class MessagesController < ApplicationController
      def show
        message = policy_scope(Message).find(params[:id])
        authorize message
        render_result(Messages::Show.call(message: message), serializer: MessageResource)
      end

      def info
        message = policy_scope(Message).find(params[:id])
        authorize message, :show?
        render_result(Messages::Info.call(message: message), serializer: MessageInfoResource)
      end

      def create
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :send?
        render_result(Messages::Send.call(conversation: conversation, sender: current_account, **send_params),
                      serializer: MessageResource, status: :created)
      end

      def update
        message = policy_scope(Message).find(params[:id])
        authorize message
        render_result(Messages::Edit.call(message: message, editor: current_account, body: params[:body]),
                      serializer: MessageResource)
      end

      def destroy
        message = policy_scope(Message).find(params[:id])
        authorize message
        render_result(Messages::Unsend.call(message: message, actor: current_account), serializer: MessageResource)
      end

      def forward
        message = policy_scope(Message).find(params[:id])
        authorize message, :forward?
        target = policy_scope(Conversation).find(params[:conversation_id])
        authorize target, :send?
        render_result(Messages::Forward.call(message: message, actor: current_account, target: target),
                      serializer: MessageResource, status: :created)
      end

      def bulk_unsend
        authorize Message, :bulk_unsend?
        render_result(
          Messages::BulkUnsend.call(actor: current_account, message_ids: params[:message_ids]),
          serializer: MessageListResource
        )
      end

      def bulk_forward
        authorize Message, :bulk_forward?
        target = policy_scope(Conversation).find(params[:conversation_id])
        authorize target, :send?
        render_result(
          Messages::BulkForward.call(
            actor: current_account, message_ids: params[:message_ids], target: target
          ),
          serializer: MessageListResource, status: :created
        )
      end

      def bulk_save
        authorize Message, :bulk_save?
        render_result(
          Messages::BulkSave.call(actor: current_account, message_ids: params[:message_ids]),
          serializer: SavedMessageListResource, status: :created
        )
      end

      private

      def send_params
        {
          body: params[:body],
          client_nonce: params[:client_nonce],
          reply_to_message_id: params[:reply_to_message_id],
          attachment_signed_ids: params[:attachment_signed_ids],
          voice_duration_ms: params[:voice_duration_ms],
          voice_waveform: params[:voice_waveform],
          poll: params[:poll],
          location: params[:location],
          contacts: params[:contacts],
          silent: params[:silent]
        }
      end
    end
  end
end
