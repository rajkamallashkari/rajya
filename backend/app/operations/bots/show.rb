module Bots
  class Show < ApplicationOperation
    def call(bot_id:)
      bot = Bot.active.includes(:owner_account, account: { avatar_attachment: :blob }).find_by(id: bot_id)
      return failure(:not_found) if bot.nil?

      success(bot)
    end
  end
end
