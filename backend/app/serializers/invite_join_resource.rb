class InviteJoinResource < ApplicationResource
  attribute :status do
    object.status
  end

  attribute :conversation do
    view = object.conversation
    next unless view

    ConversationResource.new(view).to_h
  end
end
