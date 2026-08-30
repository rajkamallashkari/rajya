module StickerPacks
  class Index < ApplicationOperation
    def call(account:, packs:)
      return failure(:forbidden) if account.blank?

      rows = packs.includes(:stickers)
                  .order(:position, :id)
                  .to_a
      success(List.new(sticker_packs: rows))
    end
  end
end
