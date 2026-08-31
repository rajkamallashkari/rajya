class BotRequestPolicy < ApplicationPolicy
  def index?
    human?
  end

  def create?
    human?
  end

  def destroy?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(requester_account_id: account.id)
    end
  end
end
