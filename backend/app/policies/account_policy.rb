class AccountPolicy < ApplicationPolicy
  def show?
    human?
  end
end
