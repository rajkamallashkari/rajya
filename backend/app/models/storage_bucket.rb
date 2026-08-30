class StorageBucket < ApplicationRecord
  STATUSES = %w[active full failed disabled].freeze

  has_many :attachments, dependent: :nullify

  validates :service_name, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :used_bytes, numericality: { greater_than_or_equal_to: 0 }
  validates :capacity_bytes, numericality: { greater_than: 0 }
  validates :priority, numericality: { greater_than_or_equal_to: 0 }

  scope :routable, -> { where(status: "active").order(:priority) }

  def capacity_available_for?(byte_size)
    used_bytes + byte_size.to_i <= capacity_bytes
  end
end
