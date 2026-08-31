class Call < ApplicationRecord
  KINDS = %w[audio video].freeze
  STATUSES = %w[ringing active ended missed declined].freeze
  IN_PROGRESS = %w[ringing active].freeze
  TERMINAL = %w[ended missed declined].freeze

  belongs_to :conversation
  belongs_to :initiator_account, class_name: "Account"

  has_many :call_participants, dependent: :destroy

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :in_progress, -> { where(status: IN_PROGRESS) }
  scope :stale_ringing, lambda {
    where(status: "ringing").where(created_at: ...Settings.fetch(:ring_timeout).seconds.ago)
  }
  scope :stale_active, lambda {
    where(status: "active").where(updated_at: ...Settings.fetch(:call_heartbeat_timeout).seconds.ago)
  }

  def self.current_for(account_id)
    in_progress
      .joins(:call_participants)
      .where(call_participants: { account_id: account_id, status: CallParticipant::LIVE })
      .order(created_at: :desc)
      .first
  end

  def self.live_for?(account_id)
    current_for(account_id).present?
  end

  def participant_for(account_id)
    call_participants.find_by(account_id: account_id)
  end

  def includes_account?(account_id)
    call_participants.exists?(account_id: account_id)
  end

  def participant_account_ids
    call_participants.pluck(:account_id)
  end

  def other_account_ids(account_id)
    call_participants.where.not(account_id: account_id).pluck(:account_id)
  end

  def terminal?
    TERMINAL.include?(status)
  end
end
