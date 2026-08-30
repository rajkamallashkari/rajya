module Polls
  class Close < ApplicationOperation
    def call(poll:, actor:)
      return failure(:forbidden) unless PollPolicy.new(actor, poll).close?
      return failure(:not_found) if poll.message.deleted?
      return failure(:conflict) if poll.closed?

      Message.transaction do
        poll.update!(closed_at: Time.current)
        poll.message.update!(revision: Conversations::Sequencer.next_revision!(poll.message.conversation_id))
      end
      Realtime.publish("conversation:#{poll.message.conversation_id}", :poll_closed, "message_id" => poll.message_id)
      success(poll.message.reload)
    end
  end
end
