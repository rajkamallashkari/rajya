class ReceiptMark < ApplicationRecord
  KINDS = %w[delivered read].freeze

  belongs_to :membership, class_name: "ConversationMembership", inverse_of: :receipt_marks

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :position, uniqueness: { scope: %i[membership_id kind] }
  validates :occurred_at, presence: true
end
