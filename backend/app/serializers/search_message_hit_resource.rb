class SearchMessageHitResource < ApplicationResource
  attributes :snippet, :can_forward

  attribute :message_id do
    object.message.id
  end

  attribute :conversation_id do
    object.message.conversation_id
  end

  attribute :created_at do
    object.message.created_at
  end

  attribute :sender_name do
    object.message.sender_account&.display_name
  end
end
