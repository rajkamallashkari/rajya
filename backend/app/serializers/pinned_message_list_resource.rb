class PinnedMessageListResource < ApplicationResource
  List = Data.define(:pinned_messages)

  attribute :pinned_messages do
    object.pinned_messages.map { |pin| PinnedMessageResource.new(pin, params: params).to_h }
  end
end
