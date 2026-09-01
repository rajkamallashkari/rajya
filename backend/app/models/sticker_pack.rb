class StickerPack < ApplicationRecord
  KINDS = %w[sticker emoji].freeze

  belongs_to :owner_account, class_name: "Account", optional: true
  has_many :stickers, dependent: :destroy

  validates :slug, presence: true, uniqueness: { case_sensitive: false }
  validates :name, presence: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  validate :name_length
  validate :slug_format
  validate :slug_length

  scope :published, -> { where.not(published_at: nil) }
  scope :owned_by, ->(account) { where(owner_account_id: account.id) }
  scope :system, -> { where(owner_account_id: nil) }

  def system?
    owner_account_id.nil?
  end

  def published?
    published_at.present?
  end

  def visible_to?(account)
    published? || (account.present? && owner_account_id == account.id)
  end

  def byte_size
    ActiveStorage::Blob.where(id: stickers.select(:blob_id)).sum(:byte_size)
  end

  private

  def name_length
    return if name.blank?
    return if name.length <= Settings.fetch(:sticker_pack_name_max_length)

    errors.add(:name, Catalog.t("errors.models.sticker_pack.name_too_long",
                                count: Settings.fetch(:sticker_pack_name_max_length)))
  end

  def slug_length
    return if slug.blank?
    return if slug.length <= Settings.fetch(:sticker_pack_slug_max_length)

    errors.add(:slug, Catalog.t("errors.models.sticker_pack.slug_too_long",
                                count: Settings.fetch(:sticker_pack_slug_max_length)))
  end

  def slug_format
    return if slug.blank?
    return if slug.to_s.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)

    errors.add(:slug, Catalog.t("errors.models.sticker_pack.slug_invalid"))
  end
end
