class SessionUserResource < ApplicationResource
  attributes :id, :email

  attribute :onboarded do
    object.onboarded_at.present?
  end
end
