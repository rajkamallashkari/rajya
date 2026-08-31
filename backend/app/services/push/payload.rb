module Push
  class Payload
    def self.for_message(account:, message:, settings:)
      conversation = message.conversation
      {
        "title" => message_title(conversation, message),
        "body" => message_body(message, settings),
        "url" => "/c/#{conversation.id}?account=#{account.id}",
        "tag" => "conversation-#{conversation.id}",
        "conversation_id" => conversation.id,
        "account_id" => account.id,
        "username" => account.username
      }
    end

    def self.for_reminder(reminder:)
      account = reminder.account
      message = reminder.message
      {
        "title" => Catalog.t("push.reminder.title"),
        "body" => reminder.note.presence || message.body.presence || Catalog.t("push.reminder.body"),
        "url" => "/c/#{message.conversation_id}/m/#{message.id}?account=#{account.id}",
        "tag" => "reminder-#{reminder.id}",
        "conversation_id" => message.conversation_id,
        "account_id" => account.id,
        "username" => account.username
      }
    end

    def self.message_title(conversation, message)
      sender = message.sender_snapshot.is_a?(Hash) ? message.sender_snapshot["display_name"] : nil
      sender = message.sender_account&.display_name if sender.blank?
      return sender.to_s if conversation.direct?

      conversation.title.presence || sender.to_s
    end
    private_class_method :message_title

    def self.message_body(message, settings)
      return Catalog.t("push.preview_hidden") if settings["show_preview"] == false

      message.body.presence || Catalog.t("push.preview_hidden")
    end
    private_class_method :message_body
  end
end
