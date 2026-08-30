class SavedReplyListResource < ApplicationResource
  attribute :saved_replies do
    object.saved_replies.map { |row| SavedReplyResource.new(row).to_h }
  end
end
