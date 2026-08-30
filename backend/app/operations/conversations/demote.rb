module Conversations
  # Owner-only demote admin → member. Demoting the owner requires transfer.
  class Demote < ApplicationOperation
    def call(actor:, conversation:, account_id:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).demote_admin?

      target = conversation.conversation_memberships.active.find_by(account_id: account_id)
      return failure(:not_found) unless target
      return failure(:forbidden) if target.owner?

      unless target.role == "member"
        target.update!(role: "member")
        MembershipSupport.write_role_changed(conversation, actor, target, "member")
      end
      success(MembershipSupport.view(actor, conversation))
    end
  end
end
