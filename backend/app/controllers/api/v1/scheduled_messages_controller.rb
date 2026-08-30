module Api
  module V1
    class ScheduledMessagesController < ApplicationController
      def index
        authorize ScheduledMessage
        render_result(
          ScheduledMessages::Index.call(account: current_account, scheduled_messages: policy_scope(ScheduledMessage)),
          serializer: ScheduledMessageListResource
        )
      end

      def create
        conversation = policy_scope(Conversation).find(params[:conversation_id])
        authorize conversation, :send?
        render_result(ScheduledMessages::Create.call(conversation: conversation, sender: current_account, **create_params),
                      serializer: ScheduledMessageResource, status: :created)
      end

      def update
        scheduled_message = policy_scope(ScheduledMessage).find(params[:id])
        authorize scheduled_message
        render_result(
          ScheduledMessages::Update.call(
            scheduled_message: scheduled_message, actor: current_account,
            body: params[:body], scheduled_at: params[:scheduled_at]
          ),
          serializer: ScheduledMessageResource
        )
      end

      def destroy
        scheduled_message = policy_scope(ScheduledMessage).find(params[:id])
        authorize scheduled_message
        render_result(ScheduledMessages::Cancel.call(scheduled_message: scheduled_message, actor: current_account),
                      serializer: OkResource)
      end

      def send_now
        scheduled_message = policy_scope(ScheduledMessage).find(params[:id])
        authorize scheduled_message, :send_now?
        render_result(ScheduledMessages::SendNow.call(scheduled_message: scheduled_message, actor: current_account),
                      serializer: MessageResource, status: :created)
      end

      private

      def create_params
        {
          body: params[:body],
          scheduled_at: params[:scheduled_at],
          client_nonce: params[:client_nonce],
          reply_to_message_id: params[:reply_to_message_id]
        }
      end
    end
  end
end
