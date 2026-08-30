module Api
  module V1
    class PollsController < ApplicationController
      def show
        poll = policy_scope(Poll).find(params[:id])
        authorize poll
        render_result(Polls::Show.call(poll: poll), serializer: PollResultsResource)
      end

      def vote
        poll = policy_scope(Poll).find(params[:id])
        authorize poll, :vote?
        render_result(
          Polls::Vote.call(poll: poll, actor: current_account, option_ids: params[:option_ids]),
          serializer: MessageResource
        )
      end

      def close
        poll = policy_scope(Poll).find(params[:id])
        authorize poll, :close?
        render_result(Polls::Close.call(poll: poll, actor: current_account), serializer: MessageResource)
      end
    end
  end
end
