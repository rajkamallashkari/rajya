module Api
  module V1
    class AccountsController < ApplicationController
      def show
        authorize Account
        skip_policy_scope
        render_result(Accounts::ShowProfile.call(viewer: current_account, account_id: params[:id]),
                      serializer: AccountResource)
      end
    end
  end
end
