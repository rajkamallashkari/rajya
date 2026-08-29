module Conversations
  class Show < ApplicationOperation
    def call(account:, conversation:)
      loaded = Conversation.includes(:last_message, conversation_memberships: :account).find(conversation.id)
      success(View.for(loaded, account, include_members: true))
    end
  end
end
