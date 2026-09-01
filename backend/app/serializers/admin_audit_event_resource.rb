class AdminAuditEventResource < ApplicationResource
  attributes :id, :action, :target_type, :target_id, :metadata, :created_at

  attribute :admin_user_id, &:admin_user_id
  attribute :ip_address do
    object.ip_address&.to_s
  end

  attribute :impersonated_account do
    account = object.impersonated_account
    account && AccountResource.new(account).to_h
  end
end
