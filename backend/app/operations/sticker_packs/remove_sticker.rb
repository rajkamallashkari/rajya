module StickerPacks
  class RemoveSticker < ApplicationOperation
    def call(sticker:, actor:)
      pack = sticker.sticker_pack
      return failure(:forbidden) unless Access.allowed?(pack, actor)

      blob = sticker.blob
      sticker.destroy!
      bucket = StorageBucket.find_by(service_name: blob.service_name)
      StorageQuotas::Release.call(account: pack.owner_account, blob: blob, bucket: bucket)
      success(true)
    end
  end
end
