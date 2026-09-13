class BotRequestPolicy < ApplicationPolicy
  def index?
    human?
  end

  def create?
    human?
  end

  def update?
    owns_request? && (record.pending? || record.status == "declined")
  end

  def destroy?
    owns_request? && (record.pending? || record.status == "declined")
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(requester_account_id: account.id)
    end
  end

  private

  def owns_request?
    human? && record.requester_account_id == account.id
  end
end
