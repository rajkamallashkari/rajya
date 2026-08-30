class GroupInvitePolicy < ApplicationPolicy
  def preview?
    true
  end

  def join?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.none
    end
  end
end
