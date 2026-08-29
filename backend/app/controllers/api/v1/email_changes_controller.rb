module Api
  module V1
    class EmailChangesController < ApplicationController
      def create
        authorize current_user, :change_email?, policy_class: UsersPolicy
        render_result(Users::Emails::Change.call(user: current_user, email: params[:email]),
                      serializer: AuthAcceptedResource)
      end

      def verify
        authorize current_user, :verify_email?, policy_class: UsersPolicy
        render_result(Users::Emails::Verify.call(user: current_user, code: params[:code]),
                      serializer: MeResource)
      end
    end
  end
end
