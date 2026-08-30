module Conversations
  class Index < ApplicationOperation
    def call(account:, conversations:, archived: false)
      memberships = ConversationMembership.active.where(account_id: account.id)
      memberships = archived ? memberships.archived : memberships.unarchived
      scoped = conversations.where(id: memberships.select(:conversation_id))
      rows = Conversations::Sidebar.call(scope: scoped, account: account)
      success(List.new(conversations: rows, viewer: account))
    end
  end
end
