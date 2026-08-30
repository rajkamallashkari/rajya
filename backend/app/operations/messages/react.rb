module Messages
  class React < ApplicationOperation
    def call(message:, actor:, emoji:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, message.conversation).react?
      return failure(:not_found) if message.deleted?

      token = emoji.to_s.strip
      return failure(:validation_failed) if token.empty?

      resolved = resolve_custom_emoji(token, actor)
      return resolved unless resolved.is_a?(String)

      reaction = persist!(message, actor, resolved)
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

    def resolve_custom_emoji(token, actor)
      sticker_id = Sticker.id_from_reaction_token(token)
      return token if sticker_id.nil?

      sticker = Sticker.find_by(id: sticker_id)
      return failure(:not_found) if sticker.nil?
      return failure(:not_found) unless sticker.sticker_pack.visible_to?(actor)
      return failure(:validation_failed) unless sticker.sticker_pack.kind == "emoji"

      sticker.reaction_token
    end
  end
end
