module Api
  module V1
    module Admin
      class TranscriptsController < ApplicationController
        def index
          conversation = Conversation.find(params[:conversation_id])
          authorize conversation, :show?, policy_class: ::Admin::TranscriptPolicy
          skip_policy_scope
          render_result(
            ::Admin::Transcripts::Show.call(
              admin: current_user, conversation: conversation,
              before: params[:before], after: params[:after], ip: request.remote_ip
            ),
            serializer: MessagePageResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
