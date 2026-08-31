module Api
  module V1
    class MessageRegenerationsController < ApplicationController
      def create
        message = policy_scope(Message).find(params[:id])
        authorize message, :regenerate?
        render_result(Bots::Regenerate.call(message: message, actor: current_account), serializer: MessageResource)
      end
    end
  end
end
