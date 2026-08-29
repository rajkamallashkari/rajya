class ContactNicknamePolicy < ApplicationPolicy
  def index?
    human?
  end

  def update?
    human?
  end

  def destroy?
    owned?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(owner_account_id: account.id)
    end
  end

  private

  def owned?
    human? && record.is_a?(ContactNickname) && record.owner_account_id == account.id
  end
end
