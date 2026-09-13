class SavedMessageResource < ApplicationResource
  attribute :id, &:id
  attribute :message_id, &:message_id
  attribute :created_at, &:created_at

  attribute :conversation do
    conversation = object.message.conversation
    view = Conversations::View.for(conversation, object.account)
    ConversationIdentityResource.new(view).to_h
  end

  attribute :conversation_title do
    conversation = object.message.conversation
    next conversation.title if conversation.title.present?

    conversation.conversation_memberships
                .select(&:active?)
                .map(&:account)
                .find { |account| account.id != object.account_id }
                &.display_name
  end

  attribute :message do
    MessageResource.new(object.message).to_h
  end
end
