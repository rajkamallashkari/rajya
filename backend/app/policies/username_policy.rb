class UsernamePolicy < ApplicationPolicy
  def show?
    human?
  end
end
