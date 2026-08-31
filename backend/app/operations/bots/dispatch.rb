module Bots
  # Enqueues a reply job for a human message. Direct bot chats always reply;
  # groups/channels only when the bot is @mentioned. Bot-authored messages
  # never dispatch (BR-83 — no cascade).
  class Dispatch < ApplicationOperation
    def call(message:)
      return success(0) unless FeatureFlag.enabled?(:async_bot_replies)
      return success(0) unless message.sender_account&.human?

      bots = targets_for(message)
      bots.each { |bot| enqueue(message, bot) }
      success(bots.size)
    end

    private

    def targets_for(message)
      members = bot_members(message.conversation)
      return members if message.conversation.direct?

      mentioned = Mentions::Parser.parse(message.body).account_ids
      members.select { |bot| mentioned.include?(bot.account_id) }
    end

    def bot_members(conversation)
      ConversationMembership.active.where(conversation_id: conversation.id)
                            .includes(account: :bot)
                            .filter_map { |row| row.account.bot if row.account.bot? }
    end

    def enqueue(message, bot)
      ReplyJob.perform_later(message.conversation_id, message.id, bot.id)
    end
  end
end
