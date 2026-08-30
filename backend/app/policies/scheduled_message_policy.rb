class ScheduledMessagePolicy < ApplicationPolicy
  def index?
    account.present?
  end

  def create?
    account.present?
  end

  def update?
    owner?
  end

  def destroy?
    owner?
  end

  def send_now?
    owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(sender_account_id: account.id)
    end
  end

  private

  def owner?
    record.is_a?(ScheduledMessage) && record.sender_account_id == account&.id
  end
end
