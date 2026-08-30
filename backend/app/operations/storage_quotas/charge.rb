module StorageQuotas
  class Charge < ApplicationOperation
    def call(account:, blob:, bucket: nil)
      return success(account && StorageQuota.ensure_for!(account)) unless first_use?(blob)

      quota = charge_account!(account, blob)
      Storage::BucketRouter.record_upload!(bucket.service_name, blob.byte_size) if bucket
      success(quota)
    end

    private

    def charge_account!(account, blob)
      return if account.nil?

      quota = StorageQuota.ensure_for!(account)
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL increment fragment
      StorageQuota.where(account_id: account.id)
                  .update_all([ "used_bytes = used_bytes + ?", blob.byte_size.to_i ])
      # rubocop:enable Rajya/NoUserFacingStrings
      quota.reload
    end

    def first_use?(blob)
      StorageQuotas.blob_uses(blob) == 1
    end
  end
end
