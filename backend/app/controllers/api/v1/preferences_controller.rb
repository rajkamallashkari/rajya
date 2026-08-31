module Api
  module V1
    class PreferencesController < ApplicationController
      def show
        authorize Preference
        skip_policy_scope
        render_result(PreferenceDocuments::Show.call(account: current_account), serializer: PreferenceResource)
      end

      def update
        authorize Preference
        skip_policy_scope
        render_result(
          PreferenceDocuments::Update.call(account: current_account, patch: preference_patch),
          serializer: PreferenceResource
        )
      end

      private

      # Strong params cannot list keys — the registry is the allow-list so a new
      # preference round-trips without a controller change (SCHEMA §7).
      def preference_patch
        raw = params[:data]
        return raw.to_unsafe_h if raw.respond_to?(:to_unsafe_h)

        raw
      end
    end
  end
end
