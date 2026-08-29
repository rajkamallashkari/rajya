class SessionPolicy < ApplicationPolicy
  def index?
    human?
  end

  def destroy?
    owned?
  end

  def others?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      owner = account&.user
      owner ? scope.active.where(user_id: owner.id) : scope.none
    end
  end

  private

  def owned?
    human? && record.is_a?(Session) && record.user_id == account.user.id
  end
end
