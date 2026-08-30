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

  attribute :archived_at do
    object.membership&.archived_at
  end

  attribute :role do
    object.membership&.role
  end

  attribute :member_permissions do
    conversation.member_permissions
  end

  attribute :slow_mode_seconds do
    conversation.slow_mode_seconds
  end

  attribute :slow_mode_until do
    reset_at = slow_mode_reset_at
    reset_at&.iso8601
  end

  attribute :restrict_forwarding do
    conversation.restrict_forwarding
  end

  attribute :permissions do
    policy = ConversationPolicy.new(object.viewer, conversation)
    MemberPermissions::KEYS.each_with_object({}) do |key, hash|
      hash[key] = policy.public_send(MemberPermissions.policy_query(key))
    end
  end

  attribute :pinned_at do
    object.membership&.pinned_at
  end

  attribute :manually_unread_at do
    object.membership&.manually_unread_at
  end

  attribute :peer do
    peer = peer_account
    peer && AccountResource.new(peer).to_h
  end

  attribute :last_message do
    message = conversation.last_message
    next unless message

    {
      "id" => message.id,
      "kind" => message.kind,
      "body" => message.deleted? ? nil : message.body,
      "deleted" => message.deleted?,
      "created_at" => message.created_at,
      "sender_name" => message.sender_account&.display_name
    }
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

  def slow_mode_reset_at
    return if conversation.slow_mode_seconds <= 0

    membership = object.membership
    return if membership.blank? || membership.admin_or_owner?

    last = membership.last_message_at
    return if last.blank?

    reset_at = last + conversation.slow_mode_seconds
    reset_at if reset_at > Time.current
  end
end
