module Messages
  class Unsave < ApplicationOperation
    def call(message:, actor:)
      return failure(:forbidden) unless ConversationPolicy.new(actor, message.conversation).save?

      record = SavedMessage.find_by(account: actor, message: message)
      return failure(:not_found) if record.nil?

      record.destroy!
      success(true)
    end
  end
end
