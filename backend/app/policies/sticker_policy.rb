class StickerPolicy < ApplicationPolicy
  def destroy?
    record.is_a?(Sticker) && record.sticker_pack.owner_account_id == account&.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.joins(:sticker_pack).merge(StickerPack.owned_by(account).or(StickerPack.published))
    end
  end
end
