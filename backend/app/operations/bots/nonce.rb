module Bots
  # Deterministic UUID v5 from the legacy synthetic client_id shape
  # (BR-76: "bot_reply:<msg_id>:<bot_id>"), because messages.client_nonce is uuid.
  module Nonce
    NAMESPACE = "rajya.bot-reply"

    module_function

    def uuid(triggered_by_message_id:, bot_id:, regenerate_of_message_id: nil)
      Digest::UUID.uuid_v5(
        Digest::UUID::DNS_NAMESPACE,
        [ NAMESPACE, triggered_by_message_id, bot_id, regenerate_of_message_id ].join(":")
      )
    end

    def generation_id(conversation_id:, triggered_by_message_id:, bot_id:, regenerate_of_message_id: nil)
      [ conversation_id, triggered_by_message_id, bot_id, regenerate_of_message_id ].compact.join(":")
    end
  end
end
