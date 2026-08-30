module Conversations
  # Soft-remove (SCHEMA §3.2). Cannot drop below min_members (BR-53). The owner
  # cannot be removed; they must transfer first.
  class RemoveMember < ApplicationOperation
    def call(actor:, conversation:, account_id:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).remove_member?
      return failure(:forbidden) if conversation.direct?
      return failure(:validation_failed) if actor.id == account_id.to_i

      target = conversation.conversation_memberships.active.find_by(account_id: account_id)
      return failure(:not_found) unless target
      return failure(:forbidden) if target.owner?
      return failure(:validation_failed) if below_floor?(conversation)

      Conversation.transaction do
        target.update!(status: "removed")
        MembershipSupport.clear_personal_state(conversation, target.account)
        SystemEvents::Write.call(
          conversation: conversation, event: "member_removed", actor: actor,
          payload: { name: target.account.display_name }
        )
        MembershipSupport.notify_departed(target.account, conversation)
      end
      success(MembershipSupport.view(actor, conversation))
    end

    private

    def below_floor?(conversation)
      conversation.conversation_memberships.active.count <= Settings.fetch(:min_members)
    end
  end
end
