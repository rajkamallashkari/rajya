module StorageQuotas
  class Release < ApplicationOperation
    def call(account:, blob:, bucket: nil)
      return success(account && StorageQuota.ensure_for!(account)) if still_attached?(blob)

      quota = release_account!(account, blob)
      Storage::BucketRouter.record_deletion!(bucket.service_name, blob.byte_size) if bucket
      success(quota)
    end

    private

    def release_account!(account, blob)
      return if account.nil?

      quota = StorageQuota.ensure_for!(account)
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL decrement fragment
      StorageQuota.where(account_id: account.id)
                  .update_all([ "used_bytes = GREATEST(0, used_bytes - ?)", blob.byte_size.to_i ])
      # rubocop:enable Rajya/NoUserFacingStrings
      quota.reload
    end

    def still_attached?(blob)
      StorageQuotas.blob_uses(blob).positive?
    end
  end
end
