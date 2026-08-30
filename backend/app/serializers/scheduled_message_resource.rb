class ScheduledMessageResource < ApplicationResource
  attributes :id, :conversation_id, :body, :scheduled_at, :client_nonce, :reply_to_message_id, :created_at
end
