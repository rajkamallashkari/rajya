class AdminConversationResource < ApplicationResource
  attributes :id, :kind, :title, :last_activity_at

  attribute :member_count do
    object.conversation_memberships.size
  end
end
