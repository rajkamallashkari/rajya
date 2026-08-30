class Conversation < ApplicationRecord
  KINDS = %w[direct group channel].freeze

  belongs_to :last_message, class_name: "Message", optional: true
  belongs_to :summarized_through_message, class_name: "Message", optional: true

  has_many :conversation_memberships, dependent: :destroy
  has_many :accounts, through: :conversation_memberships
  has_many :messages, dependent: :destroy
  has_many :pinned_messages, dependent: :destroy
  has_many :calls, dependent: :destroy
  has_many :conversation_folder_entries, dependent: :destroy
  has_many :scheduled_messages, dependent: :destroy
  has_many :group_invites, dependent: :destroy
  has_many :join_requests, dependent: :destroy

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :last_activity_at, presence: true
  validates :slow_mode_seconds, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validate :direct_key_only_for_direct
  validate :groups_have_titles
  validate :member_permissions_are_registered

  def self.direct_key_for(left_id, right_id)
    [ left_id.to_i, right_id.to_i ].sort.join(":")
  end

  def direct?
    kind == "direct"
  end

  def group?
    kind == "group"
  end

  def channel?
    kind == "channel"
  end

  private

  def direct_key_only_for_direct
    return if (kind == "direct") == direct_key.present?

    errors.add(:direct_key, Catalog.t("errors.models.conversation.direct_key"))
  end

  def groups_have_titles
    return if kind == "direct" || title.present?

    errors.add(:title, Catalog.t("errors.models.conversation.title"))
  end

  def member_permissions_are_registered
    return if MemberPermissions.valid?(member_permissions)

    errors.add(:member_permissions, Catalog.t("errors.models.conversation.member_permissions"))
  end
end
