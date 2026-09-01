module Api
  module V1
    module Admin
      class SettingsController < ApplicationController
        def index
          authorize :app_setting, :index?, policy_class: ::Admin::AppSettingPolicy
          skip_policy_scope
          render_result(::Admin::Settings::Index.call(admin: current_user), serializer: AdminSettingListResource)
        end

        def update
          authorize :app_setting, :update?, policy_class: ::Admin::AppSettingPolicy
          skip_policy_scope
          render_result(
            ::Admin::Settings::Update.call(admin: current_user, key: params[:key], value: params[:value]),
            serializer: AdminSettingResource
          )
        end

        def destroy
          authorize :app_setting, :destroy?, policy_class: ::Admin::AppSettingPolicy
          skip_policy_scope
          render_result(
            ::Admin::Settings::Destroy.call(admin: current_user, key: params[:key]),
            serializer: AdminSettingResource
          )
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
