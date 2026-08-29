class VerificationCode < ApplicationRecord
  PURPOSES = %w[login signup password_reset email_change].freeze
  CHANNELS = %w[email].freeze
  BCRYPT_PREFIX = "$2"

  belongs_to :user

  scope :active, -> { where(consumed_at: nil).where(arel_table[:expires_at].gt(Time.current)) }
  scope :otp, -> { where(arel_table[:code_digest].matches("#{BCRYPT_PREFIX}%")) }

  validates :purpose, presence: true, inclusion: { in: PURPOSES }
  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :destination, presence: true
  validates :code_digest, presence: true
  validates :expires_at, presence: true
  validates :attempts, numericality: { greater_than_or_equal_to: 0 }

  def expired?
    expires_at <= Time.current
  end

  def consumed?
    consumed_at.present?
  end

  def consume!
    update!(consumed_at: Time.current)
  end

  def record_attempt!
    increment!(:attempts)
  end
end
