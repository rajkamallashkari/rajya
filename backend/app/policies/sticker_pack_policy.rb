class StickerPackPolicy < ApplicationPolicy
  def index?
    account.present?
  end

  def create?
    human?
  end

  def show?
    visible?
  end

  def update?
    owner?
  end

  def destroy?
    owner?
  end

  def add_sticker?
    owner?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.owned_by(account).or(scope.published)
    end
  end

  private

  def owner?
    record.is_a?(StickerPack) && record.owner_account_id == account&.id
  end

  def visible?
    record.is_a?(StickerPack) && record.visible_to?(account)
  end
end
