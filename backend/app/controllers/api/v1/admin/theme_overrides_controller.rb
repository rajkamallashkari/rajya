module Api
  module V1
    module Admin
      class ThemeOverridesController < ApplicationController
        def index
          authorize :theme_override, :index?, policy_class: ::Admin::ThemeOverridePolicy
          skip_policy_scope
          render_result(::Admin::ThemeOverrides::Index.call(admin: current_user), serializer: AdminThemeOverrideListResource)
        end

        def update
          authorize :theme_override, :update?, policy_class: ::Admin::ThemeOverridePolicy
          skip_policy_scope
          render_result(
            ::Admin::ThemeOverrides::Upsert.call(
              admin: current_user, theme: params[:theme], token_name: params[:token_name], value: params[:value]
            ),
            serializer: AdminThemeOverrideResource
          )
        end

        def destroy
          authorize :theme_override, :destroy?, policy_class: ::Admin::ThemeOverridePolicy
          skip_policy_scope
          render_result(
            ::Admin::ThemeOverrides::Reset.call(
              admin: current_user, theme: params[:theme], token_name: params[:token_name]
            ),
            serializer: AdminThemeOverrideListResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
