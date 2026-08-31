class CallParticipant < ApplicationRecord
  STATUSES = %w[invited ringing joined left declined missed busy].freeze
  LIVE = %w[invited ringing joined].freeze

  belongs_to :call
  belongs_to :account

  validates :account_id, uniqueness: { scope: :call_id }
  validates :status, presence: true, inclusion: { in: STATUSES }
end
