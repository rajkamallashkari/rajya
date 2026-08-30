class StickerResource < ApplicationResource
  attributes :id, :sticker_pack_id, :shortcode, :position

  attribute :url do
    next unless object.blob

    ttl = Settings.fetch(:signed_url_ttl)
    object.blob.url(expires_in: ttl)
  rescue ArgumentError
    nil
  end
end
