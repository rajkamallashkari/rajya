class ReceiptMark < ApplicationRecord
  KINDS = %w[delivered read].freeze

  belongs_to :membership, class_name: "ConversationMembership", inverse_of: :receipt_marks

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :position, uniqueness: { scope: %i[membership_id kind] }
  validates :from_position, numericality: { greater_than_or_equal_to: 0 }
  validates :occurred_at, presence: true

  def covers?(message_position)
    from_position < message_position && position >= message_position
  end
end
