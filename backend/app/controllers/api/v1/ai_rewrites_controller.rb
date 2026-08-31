module Api
  module V1
    class AiRewritesController < ApplicationController
      def create
        authorize :ai, :rewrite?
        skip_policy_scope
        conversation = params[:conversation_id].present? ? policy_scope(Conversation).find_by(id: params[:conversation_id]) : nil
        skip_policy_scope if conversation.nil?
        render_result(
          Ai::Rewrite.call(
            account: current_account, text: params[:text], tones: params[:tones],
            instruction: params[:instruction], conversation: conversation
          ),
          serializer: RewriteResource
        )
      end
    end
  end
end
