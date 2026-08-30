module Receipts
  # Send implies read for the sender (BR-27) and increments everyone else's
  # unread badge (BR-40). Called from send and forward after the row exists.
  class OnSend < ApplicationOperation
    def call(conversation:, sender:, position:)
      membership = Conversations::View.membership_for(conversation, sender)
      Writer.mark_sender!(membership, position) if membership
      Writer.increment_others!(conversation, sender.id)
      success(true)
    end
  end
end
