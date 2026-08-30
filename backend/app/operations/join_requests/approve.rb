module JoinRequests
  class Approve < ApplicationOperation
    def call(actor:, join_request:)
      conversation = join_request.conversation
      return failure(:forbidden) unless ConversationPolicy.new(actor, conversation).approve_join?
      return failure(:conflict) unless join_request.pending? && !join_request.expired?

      if already_active?(join_request)
        resolve!(join_request, actor, "approved")
        notify_requester(join_request, "approved")
        return success(Conversations::MembershipSupport.view(actor, conversation))
      end
      return failure(:validation_failed) if over_cap?(join_request)

      Conversation.transaction do
        if join_request.group_invite_id.present? && !GroupInvite.redeem!(join_request.group_invite_id)
          raise ActiveRecord::Rollback
        end

        resolve!(join_request, actor, "approved")
        Conversations::MembershipSupport.activate!(
          conversation, join_request.account, invited_by: actor, event: "member_joined", actor: join_request.account
        )
      end
      return failure(:conflict) unless join_request.reload.approved?

      notify_requester(join_request, "approved")
      success(Conversations::MembershipSupport.view(actor, conversation))
    end

    private

    def already_active?(join_request)
      join_request.conversation.conversation_memberships.active.exists?(account_id: join_request.account_id)
    end

    def over_cap?(join_request)
      existing = join_request.conversation.conversation_memberships.find_by(account_id: join_request.account_id)
      return false if existing

      Conversations::MembershipSupport.over_member_cap?(join_request.conversation, 1)
    end

    def resolve!(join_request, actor, status)
      join_request.update!(status: status, reviewed_by_account: actor, reviewed_at: Time.current)
    end

    def notify_requester(join_request, status)
      return unless join_request.account.human?

      Realtime.publish(
        join_request.account, :join_request,
        "conversation_id" => join_request.conversation_id, "join_request_id" => join_request.id, "status" => status
      )
    end
  end
end
