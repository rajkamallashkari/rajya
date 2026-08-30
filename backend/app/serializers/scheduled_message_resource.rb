class ScheduledMessageResource < ApplicationResource
  attributes :id, :conversation_id, :body, :scheduled_at, :client_nonce, :reply_to_message_id,
             :recurrence_rule, :next_run_at, :last_run_at, :occurrences_sent, :ends_at, :created_at
end
