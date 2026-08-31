class ConversationSearchResource < ApplicationResource
  attributes :query

  attribute :messages do
    object.messages.map { |hit| SearchMessageHitResource.new(hit).to_h }
  end
end
