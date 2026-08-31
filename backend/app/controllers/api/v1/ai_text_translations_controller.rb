module Api
  module V1
    class AiTextTranslationsController < ApplicationController
      def create
        authorize :ai, :translate_text?
        skip_policy_scope
        render_result(
          Ai::TranslateText.call(
            account: current_account, text: params[:text], target_language: params[:target_language],
            source_language: params[:source_language]
          ),
          serializer: TranslationResource
        )
      end
    end
  end
end
