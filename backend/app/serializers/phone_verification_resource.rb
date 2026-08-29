class PhoneVerificationResource < ApplicationResource
  attributes :code, :wa_url, :status, :confirmed_phone, :phone_changed

  attribute :expires_at do
    object.expires_at&.iso8601
  end
end
