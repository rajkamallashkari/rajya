module Bots
  # Soft-delete the old bot reply and enqueue a new generation (BR-15).
  # Only the account whose message prompted the reply may regenerate.
  class Regenerate < ApplicationOperation
    def call(message:, actor:)
      @message = message
      @actor = actor
      return failure(:forbidden) unless MessagePolicy.new(actor, message).regenerate?
      return failure(:not_found) if triggered_by.nil?

      tombstone!
      enqueue
      success(@message.reload)
    end

    private

    def tombstone!
      Message.transaction do
        @message.update!(
          deleted_at: Time.current,
          body: nil,
          revision: Conversations::Sequencer.next_revision!(@message.conversation_id)
        )
      end
      Realtime.publish(@message.conversation, :message_deleted, "message_id" => @message.id)
    end

    def enqueue
      ReplyJob.perform_later(
        @message.conversation_id,
        triggered_by.id,
        @message.sender_account.bot.id,
        @message.id
      )
    end

    def triggered_by
      Message.find_by(id: @message.metadata["triggered_by_message_id"])
    end
  end
end
