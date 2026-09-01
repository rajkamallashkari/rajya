module Api
  module V1
    module Admin
      class BotRequestsController < ApplicationController
        def index
          authorize :bot_request, :index?, policy_class: ::Admin::BotRequestPolicy
          skip_policy_scope
          render_result(
            Bots::Requests::Index.call(actor: current_account, admin: true),
            serializer: BotRequestListResource
          )
        end

        def approve
          ip = request.remote_ip
          bot_request = BotRequest.find(params[:id])
          authorize bot_request, :approve?, policy_class: ::Admin::BotRequestPolicy
          skip_policy_scope
          render_result(
            Bots::Requests::Approve.call(admin: current_user, request: bot_request, ip: ip),
            serializer: BotResource
          )
        end

        def decline
          ip = request.remote_ip
          bot_request = BotRequest.find(params[:id])
          authorize bot_request, :decline?, policy_class: ::Admin::BotRequestPolicy
          skip_policy_scope
          render_result(
            Bots::Requests::Decline.call(
              admin: current_user, request: bot_request, reason: params[:reason], ip: ip
            ),
            serializer: BotRequestResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
