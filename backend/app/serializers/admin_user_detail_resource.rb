class AdminUserDetailResource < ApplicationResource
  attribute :user do
    AdminUserResource.new(object.user).to_h
  end

  attribute :conversations do
    object.conversations.map { |conversation| AdminConversationResource.new(conversation).to_h }
  end
end
