module Messages
  class Edit < ApplicationOperation
    def call(message:, editor:, body:)
      return failure(:forbidden) unless MessagePolicy.new(editor, message).update?
      return failure(:forbidden) unless editable?(message)
      return failure(:validation_failed) if blank_without_attachments?(message, body)
      return failure(:validation_failed) if body.to_s.length > Settings.fetch(:max_message_length)

      apply!(message, body.to_s)
      Realtime.publish("conversation:#{message.conversation_id}", :message_edited, "message_id" => message.id)
      success(message.reload)
    end

    private

    def editable?(message)
      return false if message.deleted?
      return false unless message.sender_account.present? && message.sender_account.human?

      message.created_at >= Settings.fetch(:message_edit_window).seconds.ago
    end

    def blank_without_attachments?(message, body)
      body.to_s.strip.empty? && message.attachment_count.zero?
    end

    def apply!(message, body)
      Message.transaction do
        message.message_revisions.create!(body: message.body.to_s, superseded_at: Time.current)
        message.update!(
          body: body.strip,
          edited_at: Time.current,
          revision: Conversations::Sequencer.next_revision!(message.conversation_id)
        )
      end
    end
  end
end
