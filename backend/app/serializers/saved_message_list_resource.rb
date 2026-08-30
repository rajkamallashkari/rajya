class SavedMessageListResource < ApplicationResource
  attribute :saved_messages do
    object.saved_messages.map { |row| SavedMessageResource.new(row, params: params).to_h }
  end
end
