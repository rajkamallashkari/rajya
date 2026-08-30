module StickerPacks
  class AddSticker < ApplicationOperation
    def call(pack:, actor:, signed_id:, shortcode:, position: 0)
      return failure(:forbidden) unless allowed?(pack, actor)

      blob = ActiveStorage::Blob.find_signed(signed_id.to_s)
      return failure(:not_found) if blob.nil?
      return failure(:validation_failed) unless blob.content_type.to_s.start_with?("image/")
      return failure(:validation_failed) if pack.stickers.count >= Settings.fetch(:sticker_pack_max_items)
      return failure(:quota_exceeded) unless quota_allows?(pack, blob)

      sticker = pack.stickers.create!(
        shortcode: shortcode.to_s.strip.downcase,
        blob: blob,
        position: position.to_i
      )
      bucket = StorageBucket.find_by(service_name: blob.service_name)
      StorageQuotas::Charge.call(account: pack.owner_account, blob: blob, bucket: bucket)
      success(sticker)
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      failure(:validation_failed)
    end

    private

    def allowed?(pack, actor)
      return false if actor.blank?
      return true if pack.owner_account_id == actor.id
      return false unless pack.system?

      actor.user&.is_admin?
    end

    def quota_allows?(pack, blob)
      size = blob.byte_size.to_i
      return false unless global_allows?(size)
      return false if pack.byte_size + size > Settings.fetch(:sticker_pack_max_bytes)
      return false if pool_bytes(pack) + size > Settings.fetch(:sticker_storage_max_bytes)
      return true if pack.system? || StorageQuotas.blob_uses(blob) >= 1

      StorageQuota.ensure_for!(pack.owner_account).can_upload?(size)
    end

    def global_allows?(size)
      StorageBucket.sum(:used_bytes) + size <= Settings.fetch(:global_quota_bytes)
    end

    def pool_bytes(pack)
      blob_ids = Sticker.joins(:sticker_pack)
                        .where(sticker_packs: { owner_account_id: pack.owner_account_id })
                        .select(:blob_id)
      ActiveStorage::Blob.where(id: blob_ids).sum(:byte_size)
    end
  end
end
