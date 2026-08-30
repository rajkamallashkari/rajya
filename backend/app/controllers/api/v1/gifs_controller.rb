module Api
  module V1
    class GifsController < ApplicationController
      def index
        authorize :gif_search, :index?
        skip_policy_scope
        render_result(
          Gifs::Search.call(account: current_account, query: params[:q]),
          serializer: GifListResource
        )
      end
    end
  end
end
