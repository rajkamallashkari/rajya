module Conversations
  # Soft leave. Policy encodes BR-51 (no auto-transfer) and the last-member
  # exception; the conversation is retained (SCHEMA §3.2, changes BR-52).
  class Leave < ApplicationOperation
    def call(account:, conversation:)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).leave?

      membership = View.membership_for(conversation, account)
      return failure(:not_found) unless membership&.active?

      Conversation.transaction do
        membership.update!(status: "left")
        MembershipSupport.clear_personal_state(conversation, account)
        SystemEvents::Write.call(
          conversation: conversation, event: "member_left", actor: account,
          payload: { name: account.display_name }
        )
        MembershipSupport.notify_departed(account, conversation)
      end
      success(true)
    end
  end
end
