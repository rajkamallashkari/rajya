class BotResource < ApplicationResource
  attribute :id, &:id
  attribute :memory_enabled, &:memory_enabled
  attribute :owner_account_id, &:owner_account_id

  attribute :account do
    AccountResource.new(object.account).to_h
  end
end
