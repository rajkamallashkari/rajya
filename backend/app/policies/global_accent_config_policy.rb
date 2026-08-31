class GlobalAccentConfigPolicy < ApplicationPolicy
  def index?
    account.present?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(is_active: true)
    end
  end
end
