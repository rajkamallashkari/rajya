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
          request = BotRequest.find(params[:id])
          authorize request, :approve?, policy_class: ::Admin::BotRequestPolicy
          skip_policy_scope
          render_result(
            Bots::Requests::Approve.call(admin: current_user, request: request),
            serializer: BotResource
          )
        end

        def decline
          request = BotRequest.find(params[:id])
          authorize request, :decline?, policy_class: ::Admin::BotRequestPolicy
          skip_policy_scope
          render_result(
            Bots::Requests::Decline.call(admin: current_user, request: request, reason: params[:reason]),
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
