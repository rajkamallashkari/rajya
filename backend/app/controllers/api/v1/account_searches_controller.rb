module Api
  module V1
    class AccountSearchesController < ApplicationController
      def index
        authorize Account, :search?
        skip_policy_scope
        render_result(Search::People.call(account: current_account, query: params[:q]), serializer: AccountSearchResource)
      end
    end
  end
end
