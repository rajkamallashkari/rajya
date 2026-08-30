module Gifs
  class Import < ApplicationOperation
    def call(account:, gif_id:, client: Gifs::Tenor.new)
      return failure(:not_found) unless FeatureFlag.enabled?(:gif_search, account: account)
      return failure(:validation_failed) if gif_id.to_s.strip.blank?

      hit = client.fetch(gif_id.to_s.strip)
      return failure(:upstream_failed) if hit == :missing_key || hit == :upstream_failed
      return failure(:not_found) if hit.nil?

      bytes = client.download(hit.gif_url)
      return failure(:upstream_failed) if bytes.blank?

      size = bytes.bytesize
      return failure(:quota_exceeded) unless quota_allows?(account, size)

      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(bytes),
        filename: "#{hit.id}.gif",
        content_type: "image/gif"
      )
      success(blob)
    end

    private

    def quota_allows?(account, size)
      StorageQuota.ensure_for!(account).can_upload?(size) &&
        StorageBucket.sum(:used_bytes) + size <= Settings.fetch(:global_quota_bytes)
    end
  end
end
