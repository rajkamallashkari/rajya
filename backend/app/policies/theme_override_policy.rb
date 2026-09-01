class ThemeOverridePolicy < ApplicationPolicy
  def show?
    human?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
