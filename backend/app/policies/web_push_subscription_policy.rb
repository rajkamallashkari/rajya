class WebPushSubscriptionPolicy < ApplicationPolicy
  def vapid?
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
      return scope.none unless account&.user

      scope.where(user_id: account.user.id)
    end
  end
end
