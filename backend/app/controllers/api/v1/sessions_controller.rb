module Api
  module V1
    class SessionsController < ApplicationController
      def index
        authorize ::Session
        render_result(
          Sessions::Index.call(sessions: policy_scope(::Session), current_jti: current_session.jti),
          serializer: DeviceSessionListResource
        )
      end

      def destroy
        session_row = policy_scope(::Session).find(params[:id])
        authorize session_row
        render_result(Sessions::Revoke.call(session: session_row), serializer: OkResource)
      end

      def others
        authorize ::Session
        skip_policy_scope
        render_result(
          Sessions::RevokeOthers.call(user: current_user, current_jti: current_session.jti),
          serializer: OkResource
        )
      end
    end
  end
end
