class InvitePreviewResource < ApplicationResource
  attribute :title do
    object.conversation.title
  end

  attribute :avatar_url do
    nil
  end

  attribute :member_count do
    object.member_count
  end

  attribute :kind do
    object.conversation.kind
  end

  attribute :usable do
    object.invite.usable?
  end

  attribute :requires_approval do
    object.invite.requires_approval
  end

  attribute :already_member do
    object.already_member
  end

  attribute :pending_request do
    object.pending_request
  end

  attribute :conversation_id do
    object.viewer && object.conversation.id
  end
end
