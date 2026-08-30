module SystemEvents
  # First-class system messages (NR-4, SCHEMA §4). Copy is resolved through the
  # string catalog so it is translatable and admin-editable (Q-14).
  class Write < ApplicationOperation
    def call(conversation:, event:, actor: nil, payload: {})
      @conversation = conversation
      @event = event.to_s
      @actor = actor
      @payload = payload.to_h.symbolize_keys
      return failure(:not_found) if @conversation.nil?
      return failure(:validation_failed) unless EVENTS.include?(@event)

      message = persist!
      touch_sidebar!(message)
      Realtime.publish(@conversation, :message_created, "message_id" => message.id)
      success(message)
    end

    private

    def persist!
      Message.transaction do
        position, revision = Conversations::Sequencer.next_send!(@conversation.id)
        Message.create!(
          conversation: @conversation,
          sender_account: nil,
          kind: "system",
          system_event: @event,
          body: Catalog.t("system_events.#{@event}", **@payload),
          metadata: @payload.stringify_keys.merge("actor_account_id" => @actor&.id).compact,
          position: position,
          revision: revision
        )
      end
    end

    def touch_sidebar!(message)
      @conversation.update_columns(last_message_id: message.id, last_activity_at: message.created_at)
    end
  end
end
