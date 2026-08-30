module Messages
  class Unreact < ApplicationOperation
    def call(message:, actor:, emoji:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, message.conversation).react?

      message.reactions.where(account: actor, emoji: emoji.to_s).delete_all
      Summary.refresh!(message)
      Realtime.publish("conversation:#{message.conversation_id}", :message_reacted, "message_id" => message.id)
      success(message.reload)
    end
  end
end
