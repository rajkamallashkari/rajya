class ExportJob < ApplicationRecord
  FORMATS = %w[json txt html].freeze
  STATUSES = %w[pending processing ready failed].freeze
  ERRORS = %w[quota_exceeded unreadable expired].freeze

  belongs_to :account
  belongs_to :conversation, optional: true
  belongs_to :blob, class_name: "ActiveStorage::Blob", optional: true

  validates :format, presence: true, inclusion: { in: FORMATS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :expires_at, presence: true

  scope :expired, -> { where(expires_at: ..Time.current) }

  def expired?
    expires_at <= Time.current
  end

  def ready?
    status == "ready"
  end
end
