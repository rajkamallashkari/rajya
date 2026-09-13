module Api
  module V1
    class AccountsController < ApplicationController
      def show
        authorize Account
        skip_policy_scope
        render_result(Accounts::ShowProfile.call(viewer: current_account, account_id: params[:id]),
                      serializer: AccountProfileResource)
      end

      def common_groups
        authorize Account, :show?
        skip_policy_scope
        account = Account.find(params[:id])
        render_result(
          Accounts::ListCommonGroups.call(viewer: current_account, account:),
          serializer: ConversationIdentityListResource
        )
      end
    end
  end
end
