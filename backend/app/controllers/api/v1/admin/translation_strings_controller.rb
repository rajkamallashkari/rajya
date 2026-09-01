module Api
  module V1
    module Admin
      class TranslationStringsController < ApplicationController
        def index
          authorize :translation_string, :index?, policy_class: ::Admin::TranslationStringPolicy
          skip_policy_scope
          render_result(
            ::Admin::TranslationStrings::Index.call(
              admin: current_user, locale: params[:locale] || "en", query: params[:q], surface: params[:surface]
            ),
            serializer: AdminTranslationStringListResource
          )
        end

        def update
          authorize :translation_string, :update?, policy_class: ::Admin::TranslationStringPolicy
          skip_policy_scope
          render_result(
            ::Admin::TranslationStrings::Update.call(
              admin: current_user, key: params[:key], value: params[:value], locale: params[:locale] || "en"
            ),
            serializer: AdminTranslationStringResource
          )
        end

        def destroy
          authorize :translation_string, :destroy?, policy_class: ::Admin::TranslationStringPolicy
          skip_policy_scope
          render_result(
            ::Admin::TranslationStrings::Destroy.call(
              admin: current_user, key: params[:key], locale: params[:locale] || "en"
            ),
            serializer: AdminTranslationStringResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
