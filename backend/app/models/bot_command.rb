class BotCommand < ApplicationRecord
  self.record_timestamps = false

  NAME_FORMAT = /\A[a-z0-9_]{1,32}\z/

  belongs_to :bot

  validates :name, presence: true, uniqueness: { scope: :bot_id, case_sensitive: false }
  validates :position, numericality: { greater_than_or_equal_to: 0 }
  validate :description_present
  validate :name_format
  validate :name_not_reserved

  private

  def description_present
    return if description.present?

    errors.add(:description, Catalog.t("errors.models.bot_command.description_blank"))
  end

  def name_format
    return if name.blank?
    return if name.to_s.match?(NAME_FORMAT)

    errors.add(:name, Catalog.t("errors.models.bot_command.name_invalid"))
  end

  def name_not_reserved
    return if name.blank?
    return unless SlashCommands::Builtins.reserved?(name)

    errors.add(:name, Catalog.t("errors.models.bot_command.reserved"))
  end
end
