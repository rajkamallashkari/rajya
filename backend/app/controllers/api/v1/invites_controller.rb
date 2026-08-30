module Api
  module V1
    class InvitesController < ApplicationController
      def show
        load_optional_identity
        invite = GroupInvite.find_by!(token: params[:token])
        authorize invite, :preview?
        skip_policy_scope
        render_result(Invites::Preview.call(invite: invite, viewer: current_account),
                      serializer: InvitePreviewResource)
      end

      def join
        invite = GroupInvite.find_by!(token: params[:token])
        authorize invite, :join?
        skip_policy_scope
        render_result(
          Invites::Join.call(invite: invite, account: current_account),
          serializer: InviteJoinResource
        )
      end

      private

      def skip_authentication?
        action_name == "show"
      end

      def load_optional_identity
        context = Auth::Identity.from_http(request)
        return if context.blank?

        @current_user = context.user
        @current_account = context.account
        @current_session = context.session
      end
    end
  end
end
