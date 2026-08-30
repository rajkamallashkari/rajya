class PinnedMessageResource < ApplicationResource
  attribute :id, &:id
  attribute :conversation_id, &:conversation_id
  attribute :message_id, &:message_id
  attribute :created_at, &:created_at

  attribute :message do
    MessageResource.new(object.message).to_h
  end
end
