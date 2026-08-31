module Bots
  module Requests
    List = Struct.new(:bot_requests, keyword_init: true)

    class Index < ApplicationOperation
      def call(actor:, admin: false)
        scope = BotRequest.recent.includes(:requester_account, :target_bot, :bot)
        scope = scope.where(requester_account: actor) unless admin
        success(List.new(bot_requests: scope.to_a))
      end
    end
  end
end
