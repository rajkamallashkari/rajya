class ConversationMembership < ApplicationRecord
  ROLES = %w[member admin owner].freeze
  STATUSES = %w[active left removed].freeze

  belongs_to :conversation, inverse_of: :conversation_memberships
  belongs_to :account, inverse_of: :conversation_memberships
  belongs_to :invited_by_account, class_name: "Account", optional: true

  has_many :receipt_marks, foreign_key: :membership_id, inverse_of: :membership, dependent: :destroy

  scope :active, -> { where(status: "active") }
  scope :archived, -> { where.not(archived_at: nil) }
  scope :unarchived, -> { where(archived_at: nil) }
  scope :admins_or_owners, -> { where(role: %w[admin owner]) }

  validates :account_id, uniqueness: { scope: :conversation_id }
  validates :role, presence: true, inclusion: { in: ROLES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :joined_at, presence: true
  validates :last_delivered_position, :last_read_position, :last_seen_position, :unread_count,
            numericality: { greater_than_or_equal_to: 0 }
  validate :seen_position_at_least_read_position
  validate :bots_remain_members

  def active?
    status == "active"
  end

  def admin_or_owner?
    role.in?(%w[admin owner])
  end

  def owner?
    role == "owner"
  end

  private

  def seen_position_at_least_read_position
    return if last_seen_position.nil? || last_read_position.nil?
    return if last_seen_position >= last_read_position

    errors.add(:last_seen_position, Catalog.t("errors.models.conversation_membership.seen_position"))
  end

  def bots_remain_members
    return unless account&.bot?
    return if role == "member"

    errors.add(:role, Catalog.t("errors.models.conversation_membership.bot_role"))
  end
end
