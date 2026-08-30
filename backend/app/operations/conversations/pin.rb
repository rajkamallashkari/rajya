module Conversations
  class Pin < ApplicationOperation
    def call(account:, conversation:)
      membership = View.membership_for(conversation, account)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).organize?
      return failure(:not_found) if membership.blank?

      return success(Show.call(account: account, conversation: conversation).value) if membership.pinned_at.present?
      return failure(:validation_failed) if at_cap?(account)

      membership.update!(pinned_at: Time.current)
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def at_cap?(account)
      ConversationMembership.active.where(account_id: account.id).where.not(pinned_at: nil)
                            .count >= Settings.fetch(:pinned_conversations_cap)
    end
  end
end
