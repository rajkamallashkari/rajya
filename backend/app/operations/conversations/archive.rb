module Conversations
  class Archive < ApplicationOperation
    def call(account:, conversation:)
      membership = View.membership_for(conversation, account)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).organize?
      return failure(:not_found) if membership.blank?

      membership.update!(archived_at: Time.current) if membership.archived_at.blank?
      success(Show.call(account: account, conversation: conversation).value)
    end
  end
end
