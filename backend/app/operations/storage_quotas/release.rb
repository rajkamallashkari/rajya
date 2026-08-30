module StorageQuotas
  class Release < ApplicationOperation
    def call(account:, blob:, bucket: nil)
      return success(StorageQuota.ensure_for!(account)) if still_attached?(blob)

      quota = StorageQuota.ensure_for!(account)
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL decrement fragment
      StorageQuota.where(account_id: account.id)
                  .update_all([ "used_bytes = GREATEST(0, used_bytes - ?)", blob.byte_size.to_i ])
      # rubocop:enable Rajya/NoUserFacingStrings
      Storage::BucketRouter.record_deletion!(bucket.service_name, blob.byte_size) if bucket
      success(quota.reload)
    end

    private

    def still_attached?(blob)
      ActiveStorage::Attachment.where(blob_id: blob.id).exists?
    end
  end
end
