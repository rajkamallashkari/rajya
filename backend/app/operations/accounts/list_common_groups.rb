module Accounts
  class ListCommonGroups < ApplicationOperation
    def call(viewer:, account:)
      return failure(:not_found) if account.deactivated?
      return failure(:not_found) if account.blocks_initiated.exists?(blocked_account_id: viewer.id)

      blocked = viewer.blocks_initiated.exists?(blocked_account_id: account.id)
      return success(Conversations::List.new(conversations: [], viewer:)) if blocked

      shared_ids = ConversationMembership.active.where(account: account).select(:conversation_id)
      conversations = ConversationPolicy::Scope.new(viewer, Conversation.all).resolve
                                        .where(kind: %w[group channel], id: shared_ids)
                                        .includes(
                                          conversation_memberships: {
                                            account: [ avatar_attachment: :blob ]
                                          }
                                        )
                                        .order(last_activity_at: :desc)
                                        .to_a
      success(Conversations::List.new(conversations:, viewer:))
    end
  end
end
