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
            target_bot_id: params[:target_bot_id], avatar: params[:avatar],
            avatar_provided: params.key?(:avatar)
          ),
          serializer: BotRequestResource, status: :created
        )
      end

      def update
        bot_request = policy_scope(BotRequest).find(params[:id])
        authorize bot_request
        render_result(
          Bots::Requests::Update.call(
            actor: current_account, request: bot_request, payload: params[:payload],
            avatar: params[:avatar], avatar_provided: params.key?(:avatar)
          ),
          serializer: BotRequestResource
        )
      end

      def destroy
        bot_request = policy_scope(BotRequest).find(params[:id])
        authorize bot_request
        render_result(
          Bots::Requests::Destroy.call(actor: current_account, request: bot_request),
          serializer: OkResource
        )
      end
    end
  end
end
