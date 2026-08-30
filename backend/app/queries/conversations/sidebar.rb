# Sidebar read — one indexed query over denormalized last_activity_at / last_message_id
# (F-4). Pinned memberships sort first (NR-21). Callers pass a policy-scoped relation
# so left/removed rows stay out. Archive filtering is the Index operation's job.
module Conversations
  class Sidebar < ApplicationQuery
    def initialize(scope:, account:)
      @scope = scope
      @account = account
    end

    def call
      memberships = ConversationMembership.arel_table
      conversations = Conversation.arel_table
      @scope
        .joins(:conversation_memberships)
        .where(conversation_memberships: { account_id: @account.id, status: "active" })
        .includes(last_message: :sender_account, conversation_memberships: :account)
        .order(memberships[:pinned_at].desc.nulls_last, conversations[:last_activity_at].desc)
        .to_a
    end
  end
end
