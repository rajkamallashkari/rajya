class BotPolicy < ApplicationPolicy
  def index?
    human?
  end

  def show?
    human?
  end

  def destroy?
    human? && record.owner_account_id == account.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.active.where(owner_account_id: account.id)
    end
  end
end
