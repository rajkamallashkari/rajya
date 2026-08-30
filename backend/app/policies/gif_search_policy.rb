class GifSearchPolicy < ApplicationPolicy
  def index?
    human?
  end
end
