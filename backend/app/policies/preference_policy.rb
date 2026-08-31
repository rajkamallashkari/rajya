class PreferencePolicy < ApplicationPolicy
  def show?
    human?
  end

  def update?
    human?
  end
end
