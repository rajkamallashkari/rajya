module Messages
  class Pin < ApplicationOperation
    def call(message:, actor:)
      conversation = message.conversation
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).pin?
      return failure(:not_found) if message.deleted?

      existing = conversation.pinned_messages.find_by(message_id: message.id)
      return success(existing) if existing
      return failure(:validation_failed) if at_cap?(conversation)

      pin = conversation.pinned_messages.create!(message: message, pinned_by_account: actor)
      Realtime.publish("conversation:#{conversation.id}", :message_pinned, "message_id" => message.id)
      SystemEvents::Write.call(
        conversation: conversation, event: "message_pinned", actor: actor, payload: { name: actor.display_name }
      )
      success(pin)
    end

    private

    def at_cap?(conversation)
      conversation.pinned_messages.count >= Settings.fetch(:pins_per_conversation)
    end
  end
end
