class Attachment < ApplicationRecord
  KINDS = %w[image video audio voice file].freeze
  PROCESSING_STATUSES = %w[pending ready failed].freeze

  belongs_to :message
  belongs_to :storage_bucket, optional: true
  has_one_attached :file

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :content_type, presence: true
  validates :byte_size, numericality: { greater_than_or_equal_to: 0 }
  validates :processing_status, presence: true, inclusion: { in: PROCESSING_STATUSES }

  def self.kind_for(content_type)
    type = content_type.to_s
    return "image" if type.start_with?("image/")
    return "video" if type.start_with?("video/")
    return "audio" if type.start_with?("audio/")

    "file"
  end
end
