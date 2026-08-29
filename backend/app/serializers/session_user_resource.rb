class SessionUserResource < ApplicationResource
  attributes :id, :email, :phone

  attribute :onboarded do
    object.onboarded_at.present?
  end

  attribute :has_password do
    object.password_digest.present?
  end

  attribute :has_passkey do
    object.passkeys.exists?
  end

  attribute :phone_verified do
    object.phone_verified_at.present?
  end
end
