class BotRequest < ApplicationRecord
  KINDS = %w[create edit].freeze
  STATUSES = %w[pending approved declined].freeze

  belongs_to :bot, optional: true, inverse_of: :created_requests
  belongs_to :target_bot, class_name: "Bot", optional: true, inverse_of: :requests_targeting_self
  belongs_to :requester_account, class_name: "Account", inverse_of: :requested_bots

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }
end
