module StickerPacks
  class Destroy < ApplicationOperation
    def call(pack:, actor:)
      return failure(:forbidden) unless actor && pack.owner_account_id == actor.id

      blobs = pack.stickers.includes(:blob).map(&:blob)
      account = pack.owner_account
      pack.destroy!
      blobs.each do |blob|
        bucket = StorageBucket.find_by(service_name: blob.service_name)
        StorageQuotas::Release.call(account: account, blob: blob, bucket: bucket)
      end
      success(true)
    end
  end
end
