class Call < ApplicationRecord
  KINDS = %w[audio video].freeze
  STATUSES = %w[ringing active ended missed declined].freeze

  belongs_to :conversation
  belongs_to :initiator_account, class_name: "Account"

  has_many :call_participants, dependent: :destroy

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :status, presence: true, inclusion: { in: STATUSES }
end
