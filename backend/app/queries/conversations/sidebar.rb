# Sidebar read — one indexed query over denormalized last_activity_at / last_message_id
# (F-4). Callers pass a policy-scoped relation so left/removed/archived rows stay out.
module Conversations
  class Sidebar < ApplicationQuery
    def initialize(scope:)
      @scope = scope
    end

    def call
      @scope
        .includes(:last_message, conversation_memberships: :account)
        .order(last_activity_at: :desc)
        .to_a
    end
  end
end
