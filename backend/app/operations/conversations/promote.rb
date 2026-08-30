module Conversations
  # Owner-only promote to admin (SCHEMA §3.1). Bots never hold admin/owner.
  class Promote < ApplicationOperation
    def call(actor:, conversation:, account_id:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).promote_admin?

      target = conversation.conversation_memberships.active.find_by(account_id: account_id)
      return failure(:not_found) unless target
      return failure(:forbidden) if target.owner? || target.account.bot?

      unless target.role == "admin"
        target.update!(role: "admin")
        MembershipSupport.write_role_changed(conversation, actor, target, "admin")
      end
      success(MembershipSupport.view(actor, conversation))
    end
  end
end
