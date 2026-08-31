class MessagePolicy < ApplicationPolicy
  def show?
    record.is_a?(Message) && conversation_policy.show?
  end

  def update?
    own? && conversation_policy.edit_own?
  end

  def destroy?
    own? && conversation_policy.unsend_own?
  end

  def forward?
    conversation_policy.forward? && !record.conversation.restrict_forwarding
  end

  def react?
    conversation_policy.react?
  end

  def save?
    conversation_policy.save?
  end

  def pin?
    conversation_policy.pin?
  end

  def regenerate?
    return false unless account
    return false unless record.is_a?(Message)
    return false unless conversation_policy.show?
    return false unless record.sender_account&.bot?
    return false if record.deleted?

    record.metadata["prompted_by_account_id"].to_i == account.id
  end

  def translate?
    human? && show?
  end

  def bulk_unsend?
    account.present?
  end

  def bulk_forward?
    account.present?
  end

  def bulk_save?
    account.present?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(
        conversation_id: ConversationMembership.active.where(account_id: account.id).select(:conversation_id)
      )
    end
  end

  private

  def own?
    record.is_a?(Message) && record.sender_account_id == account&.id
  end

  def conversation_policy
    ConversationPolicy.new(account, record.conversation)
  end
end
