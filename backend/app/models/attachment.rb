class Attachment < ApplicationRecord
  KINDS = %w[image video audio voice file].freeze
  PROCESSING_STATUSES = %w[pending ready failed].freeze
  PROCESSING_ERRORS = %w[ffmpeg_missing unreadable blocked_type probe_failed].freeze
  TRANSCRIPT_STATUSES = %w[pending ready failed].freeze
  # waveform: JSON array of floats in [0.0, 1.0], length Settings.fetch(:waveform_peak_count), or NULL.

  belongs_to :message
  belongs_to :storage_bucket, optional: true
  has_one_attached :file
  has_one_attached :thumbnail

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :content_type, presence: true
  validates :byte_size, numericality: { greater_than_or_equal_to: 0 }
  validates :processing_status, presence: true, inclusion: { in: PROCESSING_STATUSES }
  validates :transcript_status, inclusion: { in: TRANSCRIPT_STATUSES }, allow_nil: true

  def self.kind_for(content_type)
    type = content_type.to_s
    return "image" if type.start_with?("image/")
    return "video" if type.start_with?("video/")
    return "audio" if type.start_with?("audio/")

    "file"
  end

  def voice?
    kind == "voice"
  end

  def pdf?
    content_type == "application/pdf"
  end

  def processing_stalled?
    processing_status == "pending" && updated_at <= Settings.fetch(:media_process_stale_after).seconds.ago
  end

  def visible_processing_status
    processing_status
  end

  def visible_processing_error
    return "stalled" if processing_stalled?

    processing_error
  end

  # A pending transcript only means "a worker is on it" for as long as the job
  # can plausibly still be running. Past that it is indistinguishable from a
  # failure, and callers must not present it as work in progress (NR-33).
  def transcript_stalled?
    transcript_status == "pending" && updated_at <= Settings.fetch(:transcribe_stale_after).seconds.ago
  end

  def visible_transcript_status
    transcript_stalled? ? "failed" : transcript_status
  end
end
