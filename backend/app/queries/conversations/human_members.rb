# Human members of a conversation, resolved in one query so fanout never walks
# participants row-by-row (F-19 / TARGET §3).
module Conversations
  class HumanMembers < ApplicationQuery
    def initialize(conversation_id:)
      @conversation_id = conversation_id
    end

    def call
      ConversationMembership.active
                            .joins(:account)
                            .where(conversation_id: @conversation_id, accounts: { kind: "human" })
                            .pluck(:account_id)
    end
  end
end
