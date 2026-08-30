class GroupInviteListResource < ApplicationResource
  attribute :invites do
    object.invites.map { |invite| GroupInviteResource.new(invite).to_h }
  end
end
