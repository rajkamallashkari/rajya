class AiUsageEvent < ApplicationRecord
  STATUSES = %w[success failed fallback].freeze

  belongs_to :account, optional: true
  belongs_to :conversation, optional: true

  validates :capability, presence: true
  validates :provider, presence: true
  validates :model, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
end
