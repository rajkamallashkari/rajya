class Sticker < ApplicationRecord
  self.record_timestamps = false

  belongs_to :sticker_pack
  belongs_to :blob, class_name: "ActiveStorage::Blob"

  validates :shortcode, presence: true, uniqueness: { scope: :sticker_pack_id, case_sensitive: false }
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  validate :shortcode_length
  validate :shortcode_format

  def reaction_token
    ":#{id}:"
  end

  def self.id_from_reaction_token(token)
    match = token.to_s.match(/\A:(\d+):\z/)
    match ? match[1].to_i : nil
  end

  private

  def shortcode_length
    return if shortcode.blank?
    return if shortcode.length <= Settings.fetch(:sticker_shortcode_max_length)

    errors.add(:shortcode, Catalog.t("errors.models.sticker.shortcode_too_long",
                                     count: Settings.fetch(:sticker_shortcode_max_length)))
  end

  def shortcode_format
    return if shortcode.blank?
    return if shortcode.to_s.match?(/\A[a-z0-9]+(?:_[a-z0-9]+)*\z/)

    errors.add(:shortcode, Catalog.t("errors.models.sticker.shortcode_invalid"))
  end
end
