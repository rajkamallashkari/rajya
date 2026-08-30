module Invites
  class Join < ApplicationOperation
    def call(invite:, account:)
      return failure(:forbidden) unless GroupInvitePolicy.new(account, invite).join?
      return failure(:not_found) if invite.conversation.direct?

      membership = invite.conversation.conversation_memberships.find_by(account: account)
      return already_member(invite, account) if membership&.active?
      return request_to_join(invite, account) if invite.requires_approval
      return failure(:conflict) unless join_immediately(invite, account)

      success(outcome("joined", account, invite.conversation))
    end

    private

    def already_member(invite, account)
      success(outcome("already_member", account, invite.conversation))
    end

    def outcome(status, account, conversation)
      JoinOutcome.new(status: status, conversation: Conversations::MembershipSupport.view(account, conversation))
    end

    def request_to_join(invite, account)
      return failure(:conflict) unless invite.usable?

      existing = JoinRequest.find_by(conversation: invite.conversation, account: account)
      return failure(:conflict) if existing&.pending? && !existing.expired?

      row = existing || JoinRequest.new(conversation: invite.conversation, account: account)
      row.assign_attributes(
        status: "pending", group_invite: invite, reviewed_by_account: nil, reviewed_at: nil,
        created_at: Time.current
      )
      row.save!
      notify_admins(invite.conversation, row)
      success(JoinOutcome.new(status: "pending_approval", conversation: nil))
    end

    def join_immediately(invite, account)
      Conversation.transaction do
        new_row = invite.conversation.conversation_memberships.find_by(account: account).nil?
        if new_row && Conversations::MembershipSupport.over_member_cap?(invite.conversation, 1)
          raise ActiveRecord::Rollback
        end
        raise ActiveRecord::Rollback unless GroupInvite.redeem!(invite.id)

        cancel_pending!(invite.conversation, account)
        Conversations::MembershipSupport.activate!(
          invite.conversation, account, invited_by: invite.created_by_account,
          event: "member_joined", actor: account
        )
        true
      end
    end

    def cancel_pending!(conversation, account)
      JoinRequest.where(conversation: conversation, account: account, status: "pending").delete_all
    end

    def notify_admins(conversation, request)
      ConversationMembership.active.admins_or_owners.joins(:account)
                            .where(conversation_id: conversation.id, accounts: { kind: "human" })
                            .find_each do |membership|
        Realtime.publish(
          membership.account, :join_request,
          "conversation_id" => conversation.id, "join_request_id" => request.id, "status" => "pending"
        )
      end
    end
  end
end
