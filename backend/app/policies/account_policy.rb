class AccountPolicy < ApplicationPolicy
  def show?
    human?
  end

  def search?
    human?
  end
end
