module Bots
  class Deactivate < ApplicationOperation
    def call(actor:, bot:)
      return failure(:not_found) if bot.nil? || bot.deactivated?
      return failure(:forbidden) unless bot.owner_account_id == actor.id

      bot.deactivate!
      success(bot.reload)
    end
  end
end
