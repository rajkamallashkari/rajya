module Invites
  class Preview < ApplicationOperation
    def call(invite:, viewer: nil)
      conversation = invite.conversation
      success(
        PreviewData.new(
          invite: invite,
          conversation: conversation,
          member_count: conversation.conversation_memberships.active.count,
          viewer: viewer,
          already_member: already_member?(conversation, viewer),
          pending_request: pending_request?(conversation, viewer, invite)
        )
      )
    end

    private

    def already_member?(conversation, viewer)
      return false if viewer.blank?

      conversation.conversation_memberships.active.exists?(account_id: viewer.id)
    end

    def pending_request?(conversation, viewer, invite)
      return false if viewer.blank? || !invite.requires_approval

      conversation.join_requests.pending_open.exists?(account_id: viewer.id)
    end
  end
end
