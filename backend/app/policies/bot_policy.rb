class BotPolicy < ApplicationPolicy
  def index?
    human?
  end

  def show?
    human?
  end

  def destroy?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.joins(:account).merge(Account.active)
    end
  end
end
