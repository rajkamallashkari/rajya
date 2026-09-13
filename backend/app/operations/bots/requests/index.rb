module Bots
  module Requests
    List = Struct.new(:bot_requests, keyword_init: true)

    class Index < ApplicationOperation
      def call(actor:, admin: false, kind: nil, status: nil)
        scope = BotRequest.recent.includes(
          :requester_account, :target_bot, :bot, avatar_attachment: :blob
        )
        scope = scope.where(requester_account: actor) unless admin
        scope = scope.where(status: status) if status.present?
        scope = scope.where(kind: kind) if kind.present?
        success(List.new(bot_requests: scope.to_a))
      end
    end
  end
end
