class Reaction < ApplicationRecord
  belongs_to :message
  belongs_to :account

  validates :emoji, presence: true, uniqueness: { scope: %i[message_id account_id] }
  validate :emoji_length

  private

  def emoji_length
    return if emoji.blank?
    return if emoji.length <= Settings.fetch(:reaction_emoji_max_length)

    errors.add(:emoji, Catalog.t("errors.models.reaction.emoji_too_long",
                                 count: Settings.fetch(:reaction_emoji_max_length)))
  end
end
