module Api
  module V1
    class ConversationCommandsController < ApplicationController
      def index
        conversation = policy_scope(Conversation).find(params[:id])
        authorize conversation, :show?
        render_result(SlashCommands::Index.call(conversation: conversation),
                      serializer: SlashCommandListResource)
      end
    end
  end
end
