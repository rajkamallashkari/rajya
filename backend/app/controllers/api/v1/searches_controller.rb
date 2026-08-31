module Api
  module V1
    class SearchesController < ApplicationController
      def index
        authorize :search, :index?
        skip_policy_scope
        render_result(
          Search::Global.call(account: current_account, query: params[:q], filters: search_filters),
          serializer: GlobalSearchResource
        )
      end

      private

      def search_filters
        params.permit(*Search::Filters::PARAM_KEYS).to_h
      end
    end
  end
end
