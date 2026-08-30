module Receipts
  class ReconcileUnreads < ApplicationOperation
    def call(membership: nil)
      scope = membership ? ConversationMembership.where(id: membership.id) : ConversationMembership.all
      scope.find_each { |row| Writer.refresh_unread!(row) }
      success(true)
    end
  end
end
