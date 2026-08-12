class VerificationCode < ApplicationRecord
  PURPOSES = %w[login signup password_reset email_change].freeze
  CHANNELS = %w[email].freeze

  belongs_to :user

  validates :purpose, presence: true, inclusion: { in: PURPOSES }
  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :destination, presence: true
  validates :code_digest, presence: true
  validates :expires_at, presence: true
  validates :attempts, numericality: { greater_than_or_equal_to: 0 }
end
