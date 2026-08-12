class JoinRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :conversation
  belongs_to :account
  belongs_to :group_invite, optional: true
  belongs_to :reviewed_by_account, class_name: "Account", optional: true

  validates :account_id, uniqueness: { scope: :conversation_id }
  validates :status, presence: true, inclusion: { in: STATUSES }
end
