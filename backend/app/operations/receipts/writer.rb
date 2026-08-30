module Receipts
  # Shared watermark + receipt_mark writes (SCHEMA §5). Monotonic (BR-28).
  module Writer
    # SQL fragment — not user-facing copy.
    # rubocop:disable Rajya/NoUserFacingStrings
    UNREAD_INCREMENT_SQL = "unread_count = unread_count + 1"
    # rubocop:enable Rajya/NoUserFacingStrings

    module_function

    def deliver!(membership, position)
      return membership if position <= membership.last_delivered_position

      from = membership.last_delivered_position
      now = Time.current
      membership.update_columns(last_delivered_position: position, last_delivered_at: now)
      insert_mark!(membership, kind: "delivered", from_position: from, position: position, occurred_at: now)
      membership
    end

    def view!(membership, position, disclose_read:)
      deliver!(membership, position)
      membership.reload
      old_seen = membership.last_seen_position
      new_seen = [ old_seen, position ].max
      now = Time.current

      if disclose_read && position > old_seen
        membership.update_columns(
          last_seen_position: [ new_seen, position ].max,
          last_read_position: position,
          last_read_at: now
        )
        insert_mark!(membership, kind: "read", from_position: old_seen, position: position, occurred_at: now)
      elsif new_seen > old_seen
        membership.update_columns(last_seen_position: new_seen)
      end

      refresh_unread!(membership.reload)
      membership
    end

    def consume!(membership, position)
      view!(membership, position, disclose_read: true)
    end

    def mark_sender!(membership, position)
      view!(membership, position, disclose_read: true)
      membership.update_columns(unread_count: 0, manually_unread_at: nil)
      membership
    end

    def increment_others!(conversation, sender_id)
      ConversationMembership.active
                            .where(conversation_id: conversation.id)
                            .where.not(account_id: sender_id)
                            .where(account_id: Account.where(kind: "human").select(:id))
                            .update_all(UNREAD_INCREMENT_SQL)
    end

    def refresh_unread!(membership)
      # SQL predicates — not user-facing copy.
      # rubocop:disable Rajya/NoUserFacingStrings
      count = membership.conversation.messages.visible
                         .where("position > ?", membership.last_seen_position)
                         .where("sender_account_id IS DISTINCT FROM ?", membership.account_id)
                         .count
      # rubocop:enable Rajya/NoUserFacingStrings
      membership.update_columns(unread_count: count, manually_unread_at: nil)
    end

    def insert_mark!(membership, kind:, from_position:, position:, occurred_at:)
      ReceiptMark.insert_all(
        [ {
          membership_id: membership.id, kind: kind, from_position: from_position,
          position: position, occurred_at: occurred_at
        } ],
        unique_by: :idx_receipt_marks_unique
      )
    end
  end
end
