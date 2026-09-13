module Conversations
  class Show < ApplicationOperation
    def call(account:, conversation:, clear_unread: false)
      loaded = Conversation.includes(
        last_message: { sender_account: [ avatar_attachment: :blob ] },
        conversation_memberships: { account: [ avatar_attachment: :blob ] }
      )
                           .find(conversation.id)
      view = View.for(loaded, account, include_members: true)
      clear_manual_unread!(view.membership) if clear_unread
      success(view)
    end

    private

    def clear_manual_unread!(membership)
      return if membership.blank? || membership.manually_unread_at.blank?

      membership.update!(manually_unread_at: nil)
    end
  end
end
