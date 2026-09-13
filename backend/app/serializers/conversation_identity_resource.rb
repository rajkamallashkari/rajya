class ConversationIdentityResource < ApplicationResource
  attribute :id do
    conversation.id
  end

  attribute :kind do
    conversation.kind
  end

  attribute :title do
    conversation.title
  end

  attribute :avatar_url do
    nil
  end

  attribute :member_count do
    active_memberships.size
  end

  attribute :peer do
    peer = peer_account
    peer && AccountResource.new(peer).to_h
  end

  private

  def conversation
    object.conversation
  end

  def active_memberships
    @active_memberships ||= conversation.conversation_memberships.select(&:active?)
  end

  def peer_account
    return unless conversation.direct?

    active_memberships.map(&:account).find { |account| account.id != object.viewer.id } || object.viewer
  end
end
