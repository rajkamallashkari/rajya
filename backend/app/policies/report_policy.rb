class ReportPolicy < ApplicationPolicy
  def create?
    human?
  end

  def reasons?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(reporter_account_id: account.id)
    end
  end
end
