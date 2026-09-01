class UsersPolicy < ApplicationPolicy
  def show?
    own_user?
  end

  def update?
    own_user?
  end

  def destroy?
    own_user?
  end

  def complete_onboarding?
    own_user?
  end

  def change_email?
    own_user?
  end

  def verify_email?
    own_user?
  end

  private

  def own_user?
    return false unless human? && record.is_a?(User)
    return true if record.account_id == account.id

    record.is_admin?
  end
end
