module Api
  module V1
    class BotRequestsController < ApplicationController
      def index
        authorize BotRequest
        skip_policy_scope
        render_result(
          Bots::Requests::Index.call(actor: current_account),
          serializer: BotRequestListResource
        )
      end

      def create
        authorize BotRequest
        skip_policy_scope
        render_result(
          Bots::Requests::Create.call(
            requester: current_account, kind: params[:kind], payload: params[:payload],
            target_bot_id: params[:target_bot_id]
          ),
          serializer: BotRequestResource, status: :created
        )
      end

      def destroy
        request = policy_scope(BotRequest).find(params[:id])
        authorize request
        render_result(Bots::Requests::Destroy.call(actor: current_account, request: request), serializer: OkResource)
      end
    end
  end
end
