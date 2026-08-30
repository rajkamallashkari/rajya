class StickerPolicy < ApplicationPolicy
  def destroy?
    record.is_a?(Sticker) && record.sticker_pack.owner_account_id == account&.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.joins(:sticker_pack).where(
        "sticker_packs.owner_account_id = ? OR sticker_packs.published_at IS NOT NULL", account.id
      )
    end
  end
end
