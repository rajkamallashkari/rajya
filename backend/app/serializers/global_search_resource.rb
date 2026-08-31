class GlobalSearchResource < ApplicationResource
  attributes :query

  attribute :messages do
    object.messages.map { |hit| SearchMessageHitResource.new(hit).to_h }
  end

  attribute :accounts do
    object.accounts.map { |account| AccountResource.new(account).to_h }
  end

  attribute :conversations do
    object.conversations.map { |hit| SearchConversationHitResource.new(hit).to_h }
  end
end
