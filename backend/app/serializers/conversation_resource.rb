class ConversationResource < ApplicationResource
  attribute :id do
    conversation.id
  end

  attribute :kind do
    conversation.kind
  end

  attribute :title do
    conversation.title
  end

  attribute :description do
    conversation.description
  end

  attribute :last_activity_at do
    conversation.last_activity_at
  end

  attribute :unread_count do
    object.membership&.unread_count || 0
  end

  attribute :muted_until do
    object.membership&.muted_until
  end

  attribute :role do
    object.membership&.role
  end

  attribute :peer do
    peer = peer_account
    peer && AccountResource.new(peer).to_h
  end

  attribute :last_message do
    message = conversation.last_message
    next unless message

    { "id" => message.id, "kind" => message.kind, "body" => message.body, "created_at" => message.created_at }
  end

  attribute :members do
    next [] unless object.include_members

    conversation.conversation_memberships.select(&:active?).map do |membership|
      { "role" => membership.role, "account" => AccountResource.new(membership.account).to_h }
    end
  end

  private

  def conversation
    object.conversation
  end

  def peer_account
    return unless conversation.direct?

    others = conversation.conversation_memberships.select(&:active?).map(&:account)
    others.find { |account| account.id != object.viewer.id } || object.viewer
  end
end
