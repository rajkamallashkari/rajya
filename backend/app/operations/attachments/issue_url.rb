module Attachments
  class IssueUrl < ApplicationOperation
    def call(attachment:, variant: :original)
      return failure(:not_found) unless FeatureFlag.enabled?(:media_attachments)
      return failure(:not_found) unless attachment.file.attached?

      ttl = Settings.fetch(:signed_url_ttl)
      url = url_for(attachment, variant, ttl)
      success(UrlPayload.new(url: url, expires_at: ttl.seconds.from_now))
    end

    private

    def url_for(attachment, variant, ttl)
      blob = attachment.file.blob
      case variant.to_sym
      when :thumb then thumb_url(attachment, blob, ttl)
      else blob.url(expires_in: ttl)
      end
    end

    def thumb_url(attachment, blob, ttl)
      return attachment.thumbnail.url(expires_in: ttl) if attachment.thumbnail.attached?
      return variant_url(attachment, ttl) if attachment.kind == "image" || attachment.pdf?

      blob.url(expires_in: ttl)
    end

    def variant_url(attachment, ttl)
      dims = Settings.fetch(:image_variant_dimensions)
      quality = Settings.fetch(:image_variant_quality)
      size = dims.fetch("thumb")
      variant = attachment.file.blob.variant(
        resize_to_limit: [ size, size ],
        format: :webp,
        saver: { quality: quality.fetch("thumb") }
      )
      variant.processed.url(expires_in: ttl)
    rescue StandardError
      attachment.file.blob.url(expires_in: ttl)
    end
  end
end
