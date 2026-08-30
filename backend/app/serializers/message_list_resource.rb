class MessageListResource < ApplicationResource
  attribute :messages do
    object.messages.map { |message| MessageResource.new(message, params: params).to_h }
  end
end
