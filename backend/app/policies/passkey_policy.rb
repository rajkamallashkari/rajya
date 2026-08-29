class PasskeyPolicy < ApplicationPolicy
  def index?
    human?
  end

  def create?
    human?
  end

  def update?
    owned?
  end

  def destroy?
    owned?
  end

  def lock?
    human?
  end

  def assert_lock?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      owner = account&.user
      owner ? scope.where(user_id: owner.id) : scope.none
    end
  end

  private

  def human?
    account&.human? && account.user.present?
  end

  def owned?
    human? && record.is_a?(Passkey) && record.user_id == account.user.id
  end
end
