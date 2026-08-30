module Messages
  class Unsend < ApplicationOperation
    def call(message:, actor:)
      return failure(:forbidden) unless MessagePolicy.new(actor, message).destroy?
      return failure(:conflict) if message.deleted?
      return failure(:forbidden) unless within_window?(message)

      Message.transaction do
        message.update!(
          deleted_at: Time.current,
          body: nil,
          revision: Conversations::Sequencer.next_revision!(message.conversation_id)
        )
      end
      Realtime.publish("conversation:#{message.conversation_id}", :message_deleted, "message_id" => message.id)
      success(message.reload)
    end

    private

    def within_window?(message)
      window = Settings.fetch(:unsend_window)
      return true if window.nil?

      message.created_at >= window.seconds.ago
    end
  end
end
