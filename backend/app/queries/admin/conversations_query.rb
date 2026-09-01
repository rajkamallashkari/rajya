# Conversations a subject account participates in — used by the admin user
# detail so an operator can open a transcript (Q-14).
module Admin
  class ConversationsQuery < ApplicationQuery
    def initialize(account:)
      @account = account
    end

    def call
      Conversation
        .joins(:conversation_memberships)
        .where(conversation_memberships: { account_id: @account.id })
        .includes(:conversation_memberships)
        .order(last_activity_at: :desc)
        .limit(::Settings.fetch(:search_page_size))
        .to_a
    end
  end
end
