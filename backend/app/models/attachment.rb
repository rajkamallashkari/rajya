class Attachment < ApplicationRecord
  KINDS = %w[image video audio voice file].freeze
  PROCESSING_STATUSES = %w[pending ready failed].freeze

  belongs_to :message
  belongs_to :storage_bucket, optional: true

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :content_type, presence: true
  validates :byte_size, numericality: { greater_than_or_equal_to: 0 }
  validates :processing_status, presence: true, inclusion: { in: PROCESSING_STATUSES }
end
