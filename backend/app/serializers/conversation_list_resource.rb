class ConversationListResource < ApplicationResource
  attribute :conversations do
    object.conversations.map do |conversation|
      ConversationResource.new(Conversations::View.for(conversation, object.viewer)).to_h
    end
  end
end
