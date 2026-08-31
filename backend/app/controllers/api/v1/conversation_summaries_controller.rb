module Api
  module V1
    class ConversationSummariesController < ApplicationController
      def create
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :summarize?
        render_result(
          Ai::Summarize.call(account: current_account, conversation: conversation, mode: params[:mode]),
          serializer: SummaryResource
        )
      end
    end
  end
end
