module Api
  module V1
    class ContactNicknamesController < ApplicationController
      def index
        authorize ContactNickname
        render_result(
          ContactNicknames::Index.call(nicknames: policy_scope(ContactNickname)),
          serializer: ContactNicknameListResource
        )
      end

      def update
        authorize ContactNickname
        skip_policy_scope
        render_result(
          ContactNicknames::Upsert.call(
            owner: current_account, target_id: params[:account_id], nickname: params[:nickname]
          ),
          serializer: ContactNicknameResource
        )
      end

      def destroy
        nickname = policy_scope(ContactNickname).find_by!(target_account_id: params[:account_id])
        authorize nickname
        render_result(ContactNicknames::Destroy.call(nickname: nickname), serializer: OkResource)
      end
    end
  end
end
