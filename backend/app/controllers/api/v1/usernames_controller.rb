module Api
  module V1
    class UsernamesController < ApplicationController
      def show
        authorize :username, :show?, policy_class: UsernamePolicy
        skip_policy_scope
        render_result(
          Accounts::CheckUsername.call(username: params[:username], except_id: current_account.id),
          serializer: UsernameAvailabilityResource
        )
      end
    end
  end
end
