class BotResource < ApplicationResource
  attribute :id, &:id
  attribute :memory_enabled, &:memory_enabled
  attribute :owner_account_id, &:owner_account_id
  attribute :persona_prompt do
    viewer = params[:current_account]
    object.persona_prompt if viewer.present? && object.owner_account_id == viewer.id
  end

  attribute :account do
    AccountResource.new(object.account).to_h
  end
end
