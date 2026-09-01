module Api
  module V1
    module Admin
      class FeatureFlagsController < ApplicationController
        def index
          authorize :feature_flag, :index?, policy_class: ::Admin::FeatureFlagPolicy
          skip_policy_scope
          render_result(::Admin::FeatureFlags::Index.call(admin: current_user), serializer: AdminFeatureFlagListResource)
        end

        def update
          authorize :feature_flag, :update?, policy_class: ::Admin::FeatureFlagPolicy
          skip_policy_scope
          render_result(
            ::Admin::FeatureFlags::Update.call(
              admin: current_user,
              key: params[:key],
              enabled: params[:enabled],
              rollout: rollout_params
            ),
            serializer: AdminFeatureFlagResource
          )
        end

        def pundit_user
          current_user
        end

        private

        def rollout_params
          params.fetch(:rollout, ActionController::Parameters.new).to_unsafe_h
        end
      end
    end
  end
end
