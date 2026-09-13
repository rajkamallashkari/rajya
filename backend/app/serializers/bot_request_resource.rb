class BotRequestResource < ApplicationResource
  attributes :id, :kind, :status, :payload, :decline_reason, :target_bot_id, :bot_id, :created_at

  attribute :avatar_url do
    next unless object.association(:avatar_attachment).loaded?
    next unless object.avatar.attached?

    Rails.application.routes.url_helpers.rails_blob_path(object.avatar, only_path: true)
  end

  attribute :requester_account_id, &:requester_account_id
end
