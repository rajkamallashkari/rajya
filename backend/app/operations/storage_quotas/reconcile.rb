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
      ids = owned_blob_ids(account)
      return 0 if ids.empty?

      ActiveStorage::Blob.where(id: ids).sum(:byte_size)
    end

    def owned_blob_ids(account)
      sticker_ids = Sticker.joins(:sticker_pack)
                           .where(sticker_packs: { owner_account_id: account.id })
                           .pluck(:blob_id)
      (sticker_ids + message_owned_blob_ids(account)).uniq
    end

    def message_owned_blob_ids(account)
      earliest = ActiveStorage::Attachment.where(record_type: "Attachment", name: "file")
                                          .group(:blob_id)
                                          .minimum(:record_id)
      return [] if earliest.empty?

      owned = Attachment.joins(:message)
                        .where(id: earliest.values, messages: { sender_account_id: account.id })
      ActiveStorage::Attachment.where(record_type: "Attachment", name: "file", record_id: owned.select(:id))
                               .where.not(blob_id: Sticker.select(:blob_id))
                               .pluck(:blob_id)
    end

    def repair_bucket(bucket)
      used = ActiveStorage::Blob.where(service_name: bucket.service_name)
                                .where(id: referenced_blob_ids)
                                .sum(:byte_size)
      status = next_status(bucket, used)
      bucket.update!(used_bytes: used, status: status)
    end

    def referenced_blob_ids
      ActiveStorage::Blob.where(id: ActiveStorage::Attachment.select(:blob_id))
                         .or(ActiveStorage::Blob.where(id: Sticker.select(:blob_id)))
                         .select(:id)
    end

    def next_status(bucket, used)
      return "full" if bucket.status == "active" && used >= bucket.capacity_bytes
      return "active" if bucket.status == "full" && used < bucket.capacity_bytes

      bucket.status
    end
  end
end
