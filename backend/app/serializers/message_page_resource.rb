class MessagePageResource < ApplicationResource
  attribute :messages do
    object.messages.map { |message| MessageResource.new(message).to_h }
  end

  attribute :meta do
    {
      "has_more_before" => object.has_more_before,
      "has_more_after" => object.has_more_after,
      "oldest_position" => object.oldest_position,
      "newest_position" => object.newest_position,
      "pivot_id" => object.pivot_id
    }
  end
end
