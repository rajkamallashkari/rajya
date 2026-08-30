module Messages
  class React < ApplicationOperation
    def call(message:, actor:, emoji:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, message.conversation).react?
      return failure(:not_found) if message.deleted?
      return failure(:validation_failed) if emoji.to_s.strip.empty?

      reaction = persist!(message, actor, emoji.to_s.strip)
      return failure(:validation_failed) unless reaction.persisted?

      Summary.refresh!(message)
      Realtime.publish("conversation:#{message.conversation_id}", :message_reacted, "message_id" => message.id)
      success(message.reload)
    end

    private

    def persist!(message, actor, emoji)
      row = message.reactions.find_or_initialize_by(account: actor, emoji: emoji)
      row.save unless row.persisted?
      row
    rescue ActiveRecord::RecordNotUnique
      message.reactions.find_by!(account: actor, emoji: emoji)
    end
  end
end
