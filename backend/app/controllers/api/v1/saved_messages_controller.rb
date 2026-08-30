module Api
  module V1
    class SavedMessagesController < ApplicationController
      def create
        message = policy_scope(Message).find(params[:message_id])
        authorize message, :save?
        render_result(Messages::Save.call(message: message, actor: current_account),
                      serializer: SavedMessageResource, status: :created)
      end

      def destroy
        message = policy_scope(Message).find(params[:id])
        authorize message, :save?
        render_result(Messages::Unsave.call(message: message, actor: current_account), serializer: OkResource)
      end
    end
  end
end
