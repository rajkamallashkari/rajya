module Conversations
  class Unpin < ApplicationOperation
    def call(account:, conversation:)
      membership = View.membership_for(conversation, account)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).organize?
      return failure(:not_found) if membership.blank?

      membership.update!(pinned_at: nil)
      success(Show.call(account: account, conversation: conversation).value)
    end
  end
end
