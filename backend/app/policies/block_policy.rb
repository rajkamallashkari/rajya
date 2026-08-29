class BlockPolicy < ApplicationPolicy
  def index?
    human?
  end

  def create?
    human?
  end

  def destroy?
    owned?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(blocker_account_id: account.id)
    end
  end

  private

  def owned?
    human? && record.is_a?(Block) && record.blocker_account_id == account.id
  end
end
