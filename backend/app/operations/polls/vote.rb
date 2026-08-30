module Polls
  # Single-choice is enforced here, inside a locked transaction (S-12). The
  # database only uniquely indexes (poll_option_id, account_id).
  class Vote < ApplicationOperation
    def call(poll:, actor:, option_ids: [])
      return failure(:forbidden) unless PollPolicy.new(actor, poll).vote?
      return failure(:not_found) if poll.message.deleted?
      return failure(:conflict) if poll.closed?

      ids = Array(option_ids).filter_map { |value| Integer(value, exception: false) }.uniq
      return failure(:validation_failed) if !poll.allows_multiple && ids.size > 1

      persist!(poll, actor, ids)
    end

    private

    def persist!(poll, actor, ids)
      Message.transaction do
        locked = Poll.lock.find(poll.id)
        return failure(:conflict) if locked.closed?

        options = locked.poll_options.where(id: ids)
        return failure(:validation_failed) if options.size != ids.size

        replace_votes!(locked, actor, ids)
        Counters.refresh!(locked)
        locked.message.update!(revision: Conversations::Sequencer.next_revision!(locked.message.conversation_id))
      end
      Realtime.publish("conversation:#{poll.message.conversation_id}", :poll_voted, "message_id" => poll.message_id)
      success(poll.message.reload)
    end

    def replace_votes!(poll, actor, ids)
      poll.poll_votes.where(account_id: actor.id).delete_all
      ids.each do |option_id|
        poll.poll_votes.create!(poll_option_id: option_id, account_id: actor.id)
      end
    end
  end
end
