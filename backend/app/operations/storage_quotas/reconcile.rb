module StorageQuotas
  class Reconcile < ApplicationOperation
    def call(account: nil)
      if account
        repair_account(account)
      else
        Account.find_each { |row| repair_account(row) }
        StorageBucket.find_each { |bucket| repair_bucket(bucket) }
      end
      success(true)
    end

    private

    def repair_account(account)
      quota = StorageQuota.ensure_for!(account)
      quota.update!(used_bytes: owned_blob_bytes(account), recomputed_at: Time.current)
    end

    def owned_blob_bytes(account)
      earliest = ActiveStorage::Attachment.where(record_type: "Attachment", name: "file")
                                          .group(:blob_id)
                                          .minimum(:record_id)
      return 0 if earliest.empty?

      owned = Attachment.joins(:message)
                        .where(id: earliest.values, messages: { sender_account_id: account.id })
      ActiveStorage::Blob.joins(:attachments)
                         .where(active_storage_attachments: {
                           record_type: "Attachment", name: "file", record_id: owned.select(:id)
                         })
                         .distinct
                         .sum(:byte_size)
    end

    def repair_bucket(bucket)
      used = ActiveStorage::Blob.where(service_name: bucket.service_name)
                                .where(id: ActiveStorage::Attachment.select(:blob_id))
                                .sum(:byte_size)
      status = next_status(bucket, used)
      bucket.update!(used_bytes: used, status: status)
    end

    def next_status(bucket, used)
      return "full" if bucket.status == "active" && used >= bucket.capacity_bytes
      return "active" if bucket.status == "full" && used < bucket.capacity_bytes

      bucket.status
    end
  end
end
