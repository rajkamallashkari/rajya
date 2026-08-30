module Uploads
  class Create < ApplicationOperation
    def call(account:, filename:, byte_size:, checksum:, content_type:)
      return failure(:not_found) unless FeatureFlag.enabled?(:direct_uploads, account: account)

      name = filename.to_s.strip
      size = byte_size.to_i
      type = content_type.to_s.strip
      digest = checksum.to_s.strip

      return failure(:validation_failed) if name.blank? || digest.blank? || size < 1
      return failure(:validation_failed) if Storage::Mime.blocked?(name, type)
      return failure(:validation_failed) if size > Storage::Mime.byte_cap_for(type)
      return failure(:quota_exceeded) unless quota_allows?(account, size)

      existing = duplicate_blob(digest, size)
      return success(skip_payload(existing)) if existing

      presign(name, size, type, digest)
    rescue Storage::BucketRouter::NoBucketAvailable
      failure(:quota_exceeded)
    end

    private

    def quota_allows?(account, size)
      quota = StorageQuota.ensure_for!(account)
      quota.can_upload?(size) && global_allows?(size)
    end

    def global_allows?(size)
      StorageBucket.sum(:used_bytes) + size <= Settings.fetch(:global_quota_bytes)
    end

    def duplicate_blob(digest, size)
      ActiveStorage::Blob.find_by(checksum: digest, byte_size: size, service_name: current_service)
    end

    def current_service
      Rails.application.config.active_storage.service.to_s
    end

    def skip_payload(blob)
      ResultPayload.new(
        blob_signed_id: blob.signed_id, direct_upload_url: nil, headers: {},
        bucket_service_name: blob.service_name, skip_upload: true
      )
    end

    def presign(name, size, type, digest)
      bucket = Storage::BucketRouter.available_for(size)
      blob = ActiveStorage::Blob.create_before_direct_upload!(
        filename: name, byte_size: size, checksum: digest, content_type: type,
        service_name: bucket.service_name
      )
      headers = blob.service.headers_for_direct_upload(
        blob.key, content_type: blob.content_type, checksum: blob.checksum
      ).compact
      success(
        ResultPayload.new(
          blob_signed_id: blob.signed_id,
          direct_upload_url: blob.service_url_for_direct_upload,
          headers: headers,
          bucket_service_name: bucket.service_name,
          skip_upload: false
        )
      )
    end
  end
end
