# NR-36 / S-18 — cooldown against persisted `conversation_memberships.last_message_at`
# so a restart cannot silently disable it. Admins and owners are exempt.
module SlowMode
  class << self
    def retry_after(conversation:, sender:)
      seconds = conversation.slow_mode_seconds
      return if seconds <= 0

      membership = Conversations::View.membership_for(conversation, sender)
      return if membership.blank? || membership.admin_or_owner?

      last = membership.last_message_at
      return if last.blank?

      remaining = (last + seconds - Time.current).ceil
      remaining if remaining.positive?
    end

    def touch!(conversation:, sender:)
      membership = Conversations::View.membership_for(conversation, sender)
      membership&.update_columns(last_message_at: Time.current, updated_at: Time.current)
    end
  end
end
