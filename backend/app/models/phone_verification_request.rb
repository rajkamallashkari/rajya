class PhoneVerificationRequest < ApplicationRecord
  belongs_to :user

  validates :code_digest, presence: true
  validates :expires_at, presence: true
end
