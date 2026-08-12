class LinkPreview < ApplicationRecord
  STATUSES = %w[pending ready failed].freeze

  has_many :message_link_previews, dependent: :destroy
  has_many :messages, through: :message_link_previews

  validates :url, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: STATUSES }
end
