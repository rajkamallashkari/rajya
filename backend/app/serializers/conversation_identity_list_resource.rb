class ConversationIdentityListResource < ApplicationResource
  attribute :conversations do
    object.conversations.map do |conversation|
      view = Conversations::View.for(conversation, object.viewer)
      ConversationIdentityResource.new(view).to_h
    end
  end
end
