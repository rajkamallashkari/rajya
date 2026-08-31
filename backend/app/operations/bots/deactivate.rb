module Bots
  class Deactivate < ApplicationOperation
    def call(actor:, bot:)
      return failure(:not_found) if bot.nil? || bot.deactivated?
      return failure(:forbidden) unless owner_or_admin?(actor, bot)

      bot.deactivate!
      success(bot.reload)
    end

    private

    def owner_or_admin?(actor, bot)
      return true if actor.user&.is_admin?
      return false if bot.owner_account_id.nil?

      bot.owner_account_id == actor.id
    end
  end
end
