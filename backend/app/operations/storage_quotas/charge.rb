module StorageQuotas
  class Charge < ApplicationOperation
    def call(account:, blob:, bucket: nil)
      return success(StorageQuota.ensure_for!(account)) unless first_use?(blob)

      quota = StorageQuota.ensure_for!(account)
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL increment fragment
      StorageQuota.where(account_id: account.id)
                  .update_all([ "used_bytes = used_bytes + ?", blob.byte_size.to_i ])
      # rubocop:enable Rajya/NoUserFacingStrings
      Storage::BucketRouter.record_upload!(bucket.service_name, blob.byte_size) if bucket
      success(quota.reload)
    end

    private

    def first_use?(blob)
      ActiveStorage::Attachment.where(blob_id: blob.id).count == 1
    end
  end
end
