module Api
  module V1
    class BotsController < ApplicationController
      def index
        authorize Bot
        skip_policy_scope
        render_result(Bots::Index.call, serializer: BotListResource)
      end

      def show
        authorize Bot
        skip_policy_scope
        render_result(Bots::Show.call(bot_id: params[:id]), serializer: BotResource)
      end

      def destroy
        bot = policy_scope(Bot).find(params[:id])
        authorize bot
        render_result(Bots::Deactivate.call(actor: current_account, bot: bot), serializer: BotResource)
      end
    end
  end
end
