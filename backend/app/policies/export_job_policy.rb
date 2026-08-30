class ExportJobPolicy < ApplicationPolicy
  def index?
    human?
  end

  def create?
    human?
  end

  def show?
    owner?
  end

  def download?
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
    human? && record.is_a?(ExportJob) && record.account_id == account.id
  end
end
