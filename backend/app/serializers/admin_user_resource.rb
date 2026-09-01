class AdminUserResource < ApplicationResource
  attributes :id, :email, :created_at

  attribute :is_admin do
    object.is_admin?
  end

  attribute :phone_verified do
    object.phone_verified_at.present?
  end

  one :account, resource: AccountResource
end
