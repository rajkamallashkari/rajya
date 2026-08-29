module Api
  module V1
    class BlocksController < ApplicationController
      def index
        authorize Block
        render_result(Blocks::Index.call(blocks: policy_scope(Block)), serializer: BlockListResource)
      end

      def create
        authorize Block
        skip_policy_scope
        render_result(Blocks::Create.call(blocker: current_account, blocked_id: params[:account_id]),
                      serializer: BlockResource, status: :created)
      end

      def destroy
        block = Block.find_by!(blocker_account_id: current_account.id, blocked_account_id: params[:id])
        authorize block
        render_result(Blocks::Destroy.call(block: block), serializer: OkResource)
      end
    end
  end
end
