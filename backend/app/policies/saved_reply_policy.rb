class SavedReplyPolicy < ApplicationPolicy
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

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(account_id: account.id)
    end
  end

  private

  def owner?
    record.is_a?(SavedReply) && record.account_id == account&.id
  end
end
