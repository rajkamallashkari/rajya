module Conversations
  # Unique `direct_key` makes the duplicate-DM race structurally impossible (F-13).
  # NR-1: a block 404s *new* directs; an existing thread is returned as-is.
  class FindOrCreateDirect < ApplicationOperation
    def call(creator:, account_id: nil, username: nil)
      target = Accounts::ResolveDirectTarget.call(creator: creator, account_id: account_id, username: username)
      return target if target.failure?

      other = target.value
      key = Conversation.direct_key_for(creator.id, other.id)
      existing = Conversation.find_by(direct_key: key)
      return success(View.for(existing, creator, include_members: true)) if existing
      return failure(:not_found) if creator.blocked_with?(other)

      success(View.for(insert_direct!(creator, other, key), creator, include_members: true))
    rescue ActiveRecord::RecordNotUnique
      success(View.for(Conversation.find_by!(direct_key: key), creator, include_members: true))
    end

    private

    def insert_direct!(creator, other, key)
      Conversation.transaction do
        conversation = Conversation.create!(kind: "direct", direct_key: key, last_activity_at: Time.current)
        add_member!(conversation, creator)
        add_member!(conversation, other) unless other.id == creator.id
        conversation
      end
    end

    def add_member!(conversation, account)
      conversation.conversation_memberships.create!(account: account, role: "member", joined_at: Time.current)
    end
  end
end
