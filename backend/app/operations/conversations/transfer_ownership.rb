module Conversations
  # Current owner becomes admin; target becomes owner. No auto-transfer (BR-51).
  class TransferOwnership < ApplicationOperation
    def call(actor:, conversation:, account_id:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).transfer_ownership?

      actor_row = View.membership_for(conversation, actor)
      target = conversation.conversation_memberships.active.find_by(account_id: account_id)
      return failure(:not_found) unless actor_row&.owner? && target
      return failure(:forbidden) if target.account.bot? || target.id == actor_row.id

      Conversation.transaction do
        actor_row.update!(role: "admin")
        target.update!(role: "owner")
        MembershipSupport.write_role_changed(conversation, actor, target, "owner")
        MembershipSupport.write_role_changed(conversation, actor, actor_row, "admin")
      end
      success(MembershipSupport.view(actor, conversation))
    end
  end
end
