class ConversationFolder < ApplicationRecord
  belongs_to :account

  has_many :conversation_folder_entries, foreign_key: :folder_id, inverse_of: :folder, dependent: :destroy
  has_many :conversations, through: :conversation_folder_entries

  validates :name, presence: true
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :name_fits

  private

  def name_fits
    return if name.blank?

    max = Settings.fetch(:folder_name_max_length)
    return if name.length <= max

    errors.add(:name, Catalog.t("errors.models.conversation_folder.name_too_long", count: max))
  end
end
