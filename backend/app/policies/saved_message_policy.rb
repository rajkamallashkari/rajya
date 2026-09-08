class SavedMessagePolicy < ApplicationPolicy
  def index?
    account.present?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(account_id: account.id)
    end
  end
end
