# User-submitted moderation queue (SCHEMA §12.11 / NR-39). `subject_id` is
# polymorphic without an FK — the create operation validates existence.
class Report < ApplicationRecord
  SUBJECT_TYPES = %w[message account conversation bot].freeze
  STATUSES = %w[pending reviewing actioned dismissed].freeze

  belongs_to :reporter_account, class_name: "Account", inverse_of: :reports
  belongs_to :reviewed_by_user, class_name: "User", optional: true, inverse_of: :reviewed_reports

  validates :subject_type, presence: true, inclusion: { in: SUBJECT_TYPES }
  validates :subject_id, presence: true
  validates :reason, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: "pending") }

  def pending?
    status == "pending"
  end
end
