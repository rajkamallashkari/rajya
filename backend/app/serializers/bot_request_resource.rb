class BotRequestResource < ApplicationResource
  attributes :id, :kind, :status, :payload, :decline_reason, :target_bot_id, :bot_id, :created_at

  attribute :requester_account_id, &:requester_account_id
end
