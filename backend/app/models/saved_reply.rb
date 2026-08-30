class SavedReply < ApplicationRecord
  belongs_to :account

  validates :position, numericality: { greater_than_or_equal_to: 0 }
  validate :shortcut_present
  validate :body_present
  validate :shortcut_length
  validate :body_length

  private

  def shortcut_present
    return if shortcut.present?

    errors.add(:shortcut, Catalog.t("errors.models.saved_reply.shortcut_blank"))
  end

  def body_present
    return if body.present?

    errors.add(:body, Catalog.t("errors.models.saved_reply.body_blank"))
  end

  def shortcut_length
    return if shortcut.blank?
    return if shortcut.length <= Settings.fetch(:saved_reply_shortcut_max_length)

    errors.add(:shortcut, Catalog.t("errors.models.saved_reply.shortcut_too_long",
                                    count: Settings.fetch(:saved_reply_shortcut_max_length)))
  end

  def body_length
    return if body.blank?
    return if body.length <= Settings.fetch(:max_message_length)

    errors.add(:body, Catalog.t("errors.models.saved_reply.body_too_long",
                                count: Settings.fetch(:max_message_length)))
  end
end
