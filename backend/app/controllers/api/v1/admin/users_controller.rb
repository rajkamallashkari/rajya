module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        def index
          authorize :user, :index?, policy_class: ::Admin::UserPolicy
          skip_policy_scope
          render_result(::Admin::Users::Index.call(admin: current_user, query: params[:q]),
                        serializer: AdminUserListResource)
        end

        def show
          target = User.find(params[:id])
          authorize target, :show?, policy_class: ::Admin::UserPolicy
          skip_policy_scope
          render_result(::Admin::Users::Show.call(admin: current_user, user: target),
                        serializer: AdminUserDetailResource)
        end

        def pundit_user
          current_user
        end
      end
    end
  end
end
