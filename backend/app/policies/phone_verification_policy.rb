class PhoneVerificationPolicy < ApplicationPolicy
  def create?
    human?
  end

  def show?
    human?
  end
end
