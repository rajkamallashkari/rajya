module Bots
  class ExtractMemoryJob < ApplicationJob
    queue_as :default
    discard_on ActiveJob::DeserializationError

    def perform(bot_id, message_id)
      bot = Bot.find_by(id: bot_id)
      message = Message.find_by(id: message_id)
      return if bot.nil? || message.nil?

      ExtractMemory.call(bot: bot, message: message)
    end
  end
end
