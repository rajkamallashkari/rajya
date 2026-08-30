class StickerPackResource < ApplicationResource
  attributes :id, :slug, :name, :kind, :position, :published_at, :owner_account_id, :created_at, :updated_at

  attribute :stickers do
    object.stickers.sort_by { |row| [ row.position, row.id ] }.map { |row| StickerResource.new(row).to_h }
  end
end
