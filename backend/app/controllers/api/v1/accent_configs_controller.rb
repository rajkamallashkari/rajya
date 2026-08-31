module Api
  module V1
    class AccentConfigsController < ApplicationController
      def index
        authorize GlobalAccentConfig
        render_result(
          AccentConfigs::Index.call(account: current_account, accents: policy_scope(GlobalAccentConfig)),
          serializer: AccentConfigListResource
        )
      end
    end
  end
end
