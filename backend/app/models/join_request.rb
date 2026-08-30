class JoinRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  belongs_to :conversation
  belongs_to :account
  belongs_to :group_invite, optional: true
  belongs_to :reviewed_by_account, class_name: "Account", optional: true

  validates :account_id, uniqueness: { scope: :conversation_id }

  validates :status, presence: true, inclusion: { in: STATUSES }

  def pending?
    status == "pending"
  end

  def approved?
    status == "approved"
  end

  def rejected?
    status == "rejected"
  end

  def expired?
    return false unless pending?

    created_at <= Time.current - Settings.fetch(:join_request_expiry).seconds
  end

  def self.pending_open
    cutoff = Time.current - Settings.fetch(:join_request_expiry).seconds
    # SQL predicate — not user-facing copy.
    # rubocop:disable Rajya/NoUserFacingStrings
    where(status: "pending").where("created_at > ?", cutoff)
    # rubocop:enable Rajya/NoUserFacingStrings
  end
end
