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
  validate :direct_key_only_for_direct
  validate :groups_have_titles

  private

  def direct_key_only_for_direct
    return if (kind == "direct") == direct_key.present?

    errors.add(:direct_key, "must be present only for direct conversations")
  end

  def groups_have_titles
    return if kind == "direct" || title.present?

    errors.add(:title, "can't be blank for non-direct conversations")
  end
end
