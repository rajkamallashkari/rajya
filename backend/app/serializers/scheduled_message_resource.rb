class ScheduledMessageResource < ApplicationResource
  attributes :id, :conversation_id, :body, :scheduled_at, :client_nonce, :reply_to_message_id,
             :recurrence_rule, :next_run_at, :last_run_at, :occurrences_sent, :ends_at, :created_at

  attribute :conversation do
    view = Conversations::View.for(object.conversation, object.sender_account)
    ConversationIdentityResource.new(view).to_h
  end
end
