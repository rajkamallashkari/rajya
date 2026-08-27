class Message < ApplicationRecord
  KINDS = %w[text system image video audio voice file].freeze

  belongs_to :conversation, inverse_of: :messages
  belongs_to :sender_account, class_name: "Account", optional: true, inverse_of: :sent_messages
  belongs_to :reply_to_message, class_name: "Message", optional: true, inverse_of: :replies
  belongs_to :forwarded_from_account, class_name: "Account", optional: true

  has_many :replies, class_name: "Message", foreign_key: :reply_to_message_id, inverse_of: :reply_to_message,
                      dependent: :nullify
  has_many :reactions, dependent: :destroy
  has_many :message_revisions, dependent: :destroy
  has_many :saved_messages, dependent: :destroy
  has_many :pinned_messages, dependent: :destroy
  has_many :attachments, dependent: :destroy
  has_many :message_link_previews, dependent: :destroy
  has_many :link_previews, through: :message_link_previews
  has_many :bot_memories, foreign_key: :source_message_id, inverse_of: :source_message, dependent: :nullify

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :position, :revision, presence: true
  validates :forward_count, :attachment_count, numericality: { greater_than_or_equal_to: 0 }
  validate :system_event_present_iff_system_kind
  validate :sender_required_unless_system

  private

  def system_event_present_iff_system_kind
    return if (kind == "system") == system_event.present?

    errors.add(:system_event, Catalog.t("errors.models.message.system_event"))
  end

  def sender_required_unless_system
    return if kind == "system" || sender_account.present? || sender_snapshot.present?

    errors.add(:sender_account_id, Catalog.t("errors.models.message.sender_required"))
  end
end
