class BotRequest < ApplicationRecord
  KINDS = %w[create edit].freeze
  STATUSES = %w[pending approved declined].freeze
  PAYLOAD_KEYS = %w[name username bio persona_prompt].freeze

  belongs_to :bot, optional: true, inverse_of: :created_requests
  belongs_to :target_bot, class_name: "Bot", optional: true, inverse_of: :requests_targeting_self
  belongs_to :requester_account, class_name: "Account", inverse_of: :requested_bots

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: "pending") }
  scope :recent, -> { order(created_at: :desc) }

  def pending?
    status == "pending"
  end

  def create_kind?
    kind == "create"
  end

  def edit_kind?
    kind == "edit"
  end

  def proposed_name
    payload.to_h["name"].to_s
  end

  def proposed_username
    payload.to_h["username"].to_s
  end

  def proposed_bio
    payload.to_h["bio"].to_s
  end

  def proposed_persona_prompt
    payload.to_h["persona_prompt"].to_s
  end
end
