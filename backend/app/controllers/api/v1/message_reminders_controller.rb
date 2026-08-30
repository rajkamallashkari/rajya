module Api
  module V1
    class MessageRemindersController < ApplicationController
      def index
        authorize MessageReminder
        render_result(
          MessageReminders::Index.call(account: current_account, message_reminders: policy_scope(MessageReminder)),
          serializer: MessageReminderListResource
        )
      end

      def create
        message = policy_scope(Message).find(params[:message_id])
        authorize MessageReminder
        render_result(
          MessageReminders::Create.call(
            account: current_account, message: message, remind_at: params[:remind_at], note: params[:note]
          ),
          serializer: MessageReminderResource,
          status: :created
        )
      end

      def update
        reminder = policy_scope(MessageReminder).find(params[:id])
        authorize reminder
        render_result(
          MessageReminders::Update.call(
            reminder: reminder, actor: current_account, remind_at: params[:remind_at],
            note: params.key?(:note) ? params[:note] : :unset
          ),
          serializer: MessageReminderResource
        )
      end

      def destroy
        reminder = policy_scope(MessageReminder).find(params[:id])
        authorize reminder
        render_result(MessageReminders::Cancel.call(reminder: reminder, actor: current_account),
                      serializer: OkResource)
      end
    end
  end
end
