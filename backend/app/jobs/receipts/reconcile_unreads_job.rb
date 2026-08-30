module Receipts
  class ReconcileUnreadsJob < ApplicationJob
    queue_as :background

    def perform(membership_id = nil)
      ReconcileUnreads.call(membership: membership_id && ConversationMembership.find_by(id: membership_id))
    end
  end
end
