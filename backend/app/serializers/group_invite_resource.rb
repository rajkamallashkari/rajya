class GroupInviteResource < ApplicationResource
  attributes :id, :token, :requires_approval, :max_uses, :uses_count, :expires_at, :created_at

  attribute :usable do
    object.usable?
  end
end
