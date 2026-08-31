module Bots
  class Show < ApplicationOperation
    def call(bot_id:)
      bot = Bot.active.includes(:account, :owner_account).find_by(id: bot_id)
      return failure(:not_found) if bot.nil?

      success(bot)
    end
  end
end
