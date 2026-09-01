module Api
  module V1
    class ThemeOverridesController < ApplicationController
      def show
        authorize ThemeOverride
        skip_policy_scope
        render_result(ThemeOverrides::Show.call(account: current_account), serializer: ThemeOverridePaletteResource)
      end
    end
  end
end
