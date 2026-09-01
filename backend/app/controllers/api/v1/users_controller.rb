module Api
  module V1
    class UsersController < ApplicationController
      def show
        authorize current_user, policy_class: UsersPolicy
        render_result(Users::Show.call(user: current_user, account: current_account), serializer: MeResource)
      end

      def update
        authorize current_user, policy_class: UsersPolicy
        render_result(Users::UpdateProfile.call(**profile_params), serializer: MeResource)
      end

      def destroy
        authorize current_user, policy_class: UsersPolicy
        render_result(Users::Deactivate.call(user: current_user), serializer: OkResource)
      end

      def complete_onboarding
        authorize current_user, :complete_onboarding?, policy_class: UsersPolicy
        render_result(Users::CompleteOnboarding.call(user: current_user), serializer: MeResource)
      end

      private

      def profile_params
        {
          user: current_user,
          display_name: params[:display_name],
          username: params[:username],
          bio: params[:bio],
          avatar: params[:avatar]
        }
      end
    end
  end
end
