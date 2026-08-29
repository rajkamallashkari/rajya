class DeviceSessionResource < ApplicationResource
  attributes :id, :device_label, :user_agent, :last_seen_at, :expires_at

  attribute :ip do
    object.ip&.to_s
  end

  attribute :current do
    object.jti.to_s == params[:current_jti].to_s
  end

  attribute :revoked do
    object.revoked_at.present?
  end
end
