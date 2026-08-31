module Api
  module V1
    class FontConfigsController < ApplicationController
      def index
        authorize FontConfig
        render_result(
          FontConfigs::Index.call(account: current_account, fonts: policy_scope(FontConfig)),
          serializer: FontConfigListResource
        )
      end
    end
  end
end
