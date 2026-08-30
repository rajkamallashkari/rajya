class PollPolicy < ApplicationPolicy
  def show?
    conversation_policy.show?
  end

  def vote?
    conversation_policy.react?
  end

  def close?
    return false unless conversation_policy.show?
    return true if poll&.message&.sender_account_id == account&.id

    conversation_policy.send? && admin_or_owner?
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

  def poll
    record if record.is_a?(Poll)
  end

  def conversation_policy
    ConversationPolicy.new(account, poll&.message&.conversation)
  end

  def admin_or_owner?
    membership = poll&.message&.conversation&.conversation_memberships&.active&.find_by(account_id: account&.id)
    membership&.admin_or_owner?
  end
end
