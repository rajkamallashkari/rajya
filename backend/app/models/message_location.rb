class MessageLocation < ApplicationRecord
  self.record_timestamps = false

  belongs_to :message

  validates :latitude, :longitude, presence: true
  validate :latitude_in_range
  validate :longitude_in_range
  before_create :stamp_created_at

  private

  def stamp_created_at
    self.created_at ||= Time.current
  end

  def latitude_in_range
    return if latitude.blank?

    min = Settings.fetch(:latitude_min)
    max = Settings.fetch(:latitude_max)
    return if latitude >= min && latitude <= max

    errors.add(:latitude, Catalog.t("errors.models.message_location.latitude", min: min, max: max))
  end

  def longitude_in_range
    return if longitude.blank?

    min = Settings.fetch(:longitude_min)
    max = Settings.fetch(:longitude_max)
    return if longitude >= min && longitude <= max

    errors.add(:longitude, Catalog.t("errors.models.message_location.longitude", min: min, max: max))
  end
end
