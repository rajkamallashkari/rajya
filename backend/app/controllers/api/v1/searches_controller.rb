module Api
  module V1
    class SearchesController < ApplicationController
      def index
        authorize :search, :index?
        skip_policy_scope
        render_result(Search::Global.call(account: current_account, query: params[:q]), serializer: GlobalSearchResource)
      end
    end
  end
end
