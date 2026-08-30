class AttachmentPolicy < ApplicationPolicy
  def show?
    record.is_a?(Attachment) && conversation_policy.show?
  end

  def retry?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.joins(:message).where(
        messages: {
          conversation_id: ConversationMembership.active.where(account_id: account.id).select(:conversation_id)
        }
      )
    end
  end

  private

  def conversation_policy
    ConversationPolicy.new(account, record.message.conversation)
  end
end
