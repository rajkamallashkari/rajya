module Messages
  class Unpin < ApplicationOperation
    def call(message:, actor:)
      conversation = message.conversation
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).pin?

      pin = conversation.pinned_messages.find_by(message_id: message.id)
      return failure(:not_found) if pin.nil?

      pin.destroy!
      Realtime.publish("conversation:#{conversation.id}", :message_unpinned, "message_id" => message.id)
      success(pin)
    end
  end
end
