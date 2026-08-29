class PhoneVerificationRequest < ApplicationRecord
  belongs_to :user

  scope :pending, -> { where(confirmed_at: nil).where(arel_table[:expires_at].gt(Time.current)) }

  validates :code_digest, presence: true
  validates :expires_at, presence: true

  def self.digest(code)
    Digest::SHA256.hexdigest(code.to_s)
  end

  def pending?
    confirmed_at.nil? && expires_at > Time.current
  end

  def expired?
    expires_at <= Time.current
  end

  def confirmed?
    confirmed_at.present?
  end
end
