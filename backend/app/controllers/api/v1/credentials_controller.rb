module Api
  module V1
    class CredentialsController < ApplicationController
      def update_password
        authorize current_user, :update_password?, policy_class: CredentialsPolicy
        render_result(Auth::Passwords::Change.call(**password_change_params), serializer: SessionResource)
      end

      def verify_password
        authorize current_user, :verify_password?, policy_class: CredentialsPolicy
        render_result(Auth::Passwords::Verify.call(user: current_user, password: params[:password]),
                      serializer: OkResource)
      end

      def destroy_email
        authorize current_user, :destroy_email?, policy_class: CredentialsPolicy
        render_result(Auth::RemoveCredential.call(user: current_user, kind: :email), serializer: OkResource)
      end

      def destroy_password
        authorize current_user, :destroy_password?, policy_class: CredentialsPolicy
        render_result(Auth::RemoveCredential.call(user: current_user, kind: :password), serializer: OkResource)
      end

      def destroy_google
        authorize current_user, :destroy_google?, policy_class: CredentialsPolicy
        render_result(Auth::RemoveCredential.call(user: current_user, kind: :google), serializer: OkResource)
      end

      private

      def password_change_params
        {
          user: current_user,
          current_password: params[:current_password],
          password: params[:password],
          password_confirmation: params[:password_confirmation]
        }
      end
    end
  end
end
