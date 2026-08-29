# The participant acting in conversations (CONVENTIONS.md §2.4) — every human
# `User` and every `Bot` has exactly one `Account`. Policies and messaging
# always key off this, never `User` directly.
class Account < ApplicationRecord
  KINDS = %w[human bot].freeze

  has_one :user, inverse_of: :account, dependent: :destroy
  has_one :bot, inverse_of: :account, dependent: :destroy
  has_one :storage_quota, inverse_of: :account, dependent: :destroy
  has_one :preference, inverse_of: :account, dependent: :destroy

  has_many :conversation_memberships, dependent: :destroy
  has_many :conversations, through: :conversation_memberships
  has_many :sent_messages, class_name: "Message", foreign_key: :sender_account_id, inverse_of: :sender_account,
                            dependent: :nullify
  has_many :reactions, dependent: :destroy
  has_many :saved_messages, dependent: :destroy
  has_many :pinned_messages, foreign_key: :pinned_by_account_id, inverse_of: :pinned_by_account, dependent: :destroy
  has_many :blocks_initiated, class_name: "Block", foreign_key: :blocker_account_id, inverse_of: :blocker_account,
                               dependent: :destroy
  has_many :blocks_received, class_name: "Block", foreign_key: :blocked_account_id, inverse_of: :blocked_account,
                              dependent: :destroy
  has_many :owned_nicknames, class_name: "ContactNickname", foreign_key: :owner_account_id,
                              inverse_of: :owner_account, dependent: :destroy
  has_many :received_nicknames, class_name: "ContactNickname", foreign_key: :target_account_id,
                                 inverse_of: :target_account, dependent: :destroy
  has_many :conversation_folders, dependent: :destroy
  has_many :call_participants, dependent: :destroy
  has_many :created_group_invites, class_name: "GroupInvite", foreign_key: :created_by_account_id,
                                    inverse_of: :created_by_account, dependent: :destroy
  has_many :join_requests, dependent: :destroy
  has_many :requested_bots, class_name: "BotRequest", foreign_key: :requester_account_id,
                             inverse_of: :requester_account, dependent: :destroy

  has_one_attached :avatar

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :display_name, presence: true
  validate :username_format

  def blocked_with?(other)
    return false if other.blank? || other.id == id

    Block.between(id, other.id).exists?
  end

  def human?
    kind == "human"
  end

  def bot?
    kind == "bot"
  end

  def deactivated?
    deactivated_at.present?
  end

  # Last-active is symmetric (BR-42): both parties must opt in. The timestamp
  # itself is always written (BR-43); this method only gates exposure.
  def last_active_at_visible_to(viewer)
    return unless human? && viewer.human?
    return unless last_active_enabled? && viewer.last_active_enabled?

    user&.last_active_at
  end

  def last_active_enabled?
    privacy_flag("last_active")
  end

  def discoverable_by_username?
    privacy_flag("discoverable_by_username")
  end

  def discoverable_by_email?
    privacy_flag("discoverable_by_email")
  end

  def discoverable_by_phone?
    privacy_flag("discoverable_by_phone")
  end

  def privacy_flag(key)
    preference ? preference.privacy(key) : Preference.privacy_default(key)
  end

  private

  def username_format
    return if username.blank?
    return if Auth::Usernames.valid_format?(username)

    min = Settings.fetch(:username_min_length)
    max = Settings.fetch(:username_max_length)
    errors.add(:username, Catalog.t("errors.models.account.username_invalid", min: min, max: max))
  end
end
