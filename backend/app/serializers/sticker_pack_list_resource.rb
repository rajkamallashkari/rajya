class StickerPackListResource < ApplicationResource
  attribute :sticker_packs do
    object.sticker_packs.map { |row| StickerPackResource.new(row).to_h }
  end
end
