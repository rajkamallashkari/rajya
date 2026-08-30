module JoinRequests
  class Reject < ApplicationOperation
    def call(actor:, join_request:)
      conversation = join_request.conversation
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).approve_join?
      return failure(:conflict) unless join_request.pending? && !join_request.expired?

      join_request.update!(status: "rejected", reviewed_by_account: actor, reviewed_at: Time.current)
      notify_requester(join_request)
      success(true)
    end

    private

    def notify_requester(join_request)
      return unless join_request.account.human?

      Realtime.publish(
        join_request.account, :join_request,
        "conversation_id" => join_request.conversation_id, "join_request_id" => join_request.id,
        "status" => "rejected"
      )
    end
  end
end
