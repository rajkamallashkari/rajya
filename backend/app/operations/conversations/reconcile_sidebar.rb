module Conversations
  # Recomputation path for denormalized last_message_id / last_activity_at (F-4,
  # SCHEMA §0 principle 3). Send (session 3.2) maintains the columns on write;
  # this operation repairs drift.
  class ReconcileSidebar < ApplicationOperation
    def call
      Conversation.find_each { |conversation| repair(conversation) }
      success(true)
    end

    private

    def repair(conversation)
      last_message = conversation.messages.order(position: :desc).first
      conversation.update_columns(
        last_message_id: last_message&.id,
        last_activity_at: last_message&.created_at || conversation.created_at
      )
    end
  end
end
