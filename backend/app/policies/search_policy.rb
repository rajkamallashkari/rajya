class SearchPolicy < ApplicationPolicy
  def index?
    human?
  end
end
