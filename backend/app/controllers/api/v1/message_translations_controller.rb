module Api
  module V1
    class MessageTranslationsController < ApplicationController
      def create
        message = policy_scope(Message).find(params[:id])
        authorize message, :translate?
        render_result(
          Ai::Translate.call(
            account: current_account, message: message, target_language: params[:target_language],
            source_language: params[:source_language]
          ),
          serializer: TranslationResource
        )
      end
    end
  end
end
