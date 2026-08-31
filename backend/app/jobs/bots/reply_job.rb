module Bots
  class ReplyJob < ApplicationJob
    queue_as :default

    def self.retry_attempts
      Settings::Registry.entries.fetch(:ai_reply_retry_attempts).fetch(:default)
    end

    retry_on StandardError, wait: :polynomially_longer, attempts: retry_attempts
    discard_on ActiveJob::DeserializationError

    def perform(conversation_id, triggered_by_message_id, bot_id, regenerate_of_message_id = nil)
      conversation = Conversation.find_by(id: conversation_id)
      bot = Bot.find_by(id: bot_id)
      triggered_by = Message.find_by(id: triggered_by_message_id)
      return if conversation.nil? || bot.nil? || triggered_by.nil?

      result = Generate.call(
        conversation: conversation, bot: bot, triggered_by: triggered_by,
        regenerate_of_message_id: regenerate_of_message_id
      )
      return if result.success?
      return if result.error_code == :not_found

      raise StandardError, result.error_code.to_s
    end
  end
end
