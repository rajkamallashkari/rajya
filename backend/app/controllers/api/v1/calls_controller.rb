module Api
  module V1
    class CallsController < ApplicationController
      def create
        conversation = Conversation.find(params[:conversation_id])
        authorize conversation, :start_call?
        render_result(
          Calls::Create.call(account: current_account, conversation: conversation, kind: params[:kind]),
          serializer: CallEnvelopeResource,
          status: :created
        )
      end

      def show
        call = Call.find(params[:id])
        authorize call
        render_result(Calls::Show.call(account: current_account, call: call), serializer: CallEnvelopeResource)
      end

      def active
        authorize :call, :active?
        skip_policy_scope
        render_result(Calls::Active.call(account: current_account), serializer: CallEnvelopeResource)
      end

      def ice_servers
        authorize :call, :ice_servers?
        skip_policy_scope
        render_result(Calls::IssueIceServers.call(account: current_account), serializer: IceServersResource)
      end

      def accept
        mutate(:accept?, Calls::Accept)
      end

      def decline
        mutate(:decline?, Calls::Decline)
      end

      def cancel
        mutate(:cancel?, Calls::Cancel)
      end

      def hangup
        mutate(:hangup?, Calls::Hangup)
      end

      private

      def mutate(query, operation)
        call = Call.find(params[:id])
        authorize call, query
        render_result(operation.call(account: current_account, call: call), serializer: CallEnvelopeResource)
      end
    end
  end
end
