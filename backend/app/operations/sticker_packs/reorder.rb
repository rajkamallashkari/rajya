module StickerPacks
  class Reorder < ApplicationOperation
    def call(actor:, ids:)
      return failure(:forbidden) unless actor&.user&.is_admin?

      packs = StickerPack.system
      wanted = Array(ids).map(&:to_i)
      return failure(:validation_failed) unless wanted.sort == packs.ids.sort

      StickerPack.transaction do
        wanted.each_with_index do |id, pos|
          packs.where(id: id).update_all(position: pos)
        end
      end
      success(List.new(sticker_packs: packs.order(:position, :id).includes(:stickers).to_a))
    end
  end
end
