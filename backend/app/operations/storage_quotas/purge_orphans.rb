module StorageQuotas
  class PurgeOrphans < ApplicationOperation
    def call
      count = 0
      orphaned_blobs.find_each do |blob|
        blob.purge
        count += 1
      end
      success(count)
    end

    private

    def orphaned_blobs
      prefix = Settings.fetch(:link_preview_blob_prefix)
      like = "#{ActiveRecord::Base.sanitize_sql_like(prefix)}%"
      # rubocop:disable Rajya/NoUserFacingStrings -- SQL predicates, not user copy
      ActiveStorage::Blob
        .where("created_at < ?", Settings.fetch(:orphan_blob_max_age).seconds.ago)
        .where.not(id: ActiveStorage::Attachment.select(:blob_id))
        .where.not(id: Sticker.select(:blob_id))
        .where.not("key LIKE ?", like)
      # rubocop:enable Rajya/NoUserFacingStrings
    end
  end
end
