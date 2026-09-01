class AdminUserListResource < ApplicationResource
  attribute :users do
    object.users.map { |user| AdminUserResource.new(user).to_h }
  end
end
