module Messages
  class Save < ApplicationOperation
    def call(message:, actor:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, message.conversation).save?
      return failure(:not_found) if message.deleted?

      record = SavedMessage.find_or_create_by!(account: actor, message: message)
      success(record)
    rescue ActiveRecord::RecordNotUnique
      success(SavedMessage.find_by!(account: actor, message: message))
    end
  end
end
