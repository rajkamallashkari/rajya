class DirectUploadPolicy < ApplicationPolicy
  def create?
    human?
  end
end
