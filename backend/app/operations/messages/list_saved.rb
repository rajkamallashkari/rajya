module Messages
  class ListSaved < ApplicationOperation
    def call(saved_messages:)
      rows = saved_messages.includes(
        account: [ avatar_attachment: :blob ],
        message: [
          { sender_account: [ avatar_attachment: :blob ] },
          {
            conversation: {
              conversation_memberships: {
                account: [ avatar_attachment: :blob ]
              }
            }
          }
        ]
      ).order(created_at: :desc)
      success(SavedList.new(saved_messages: rows.to_a))
    end
  end
end
