module Api
  module V1
    class StyleProfilesController < ApplicationController
      def show
        authorize :ai, :style_profile?
        skip_policy_scope
        render_result(Ai::StyleProfiles::Show.call(account: current_account), serializer: StyleProfileResource)
      end

      def create
        authorize :ai, :style_profile?
        skip_policy_scope
        render_result(
          Ai::StyleProfiles::Build.call(account: current_account, force: true),
          serializer: StyleProfileResource
        )
      end

      def update
        authorize :ai, :style_profile?
        skip_policy_scope
        render_result(
          Ai::StyleProfiles::UpdateConsent.call(account: current_account, enabled: params[:enabled]),
          serializer: StyleProfileResource
        )
      end
    end
  end
end
