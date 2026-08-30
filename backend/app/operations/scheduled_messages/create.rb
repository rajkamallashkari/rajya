module ScheduledMessages
  class Create < ApplicationOperation
    def call(conversation:, sender:, body:, scheduled_at:, client_nonce: nil, reply_to_message_id: nil,
             recurrence_rule: nil)
      return failure(:forbidden) unless ConversationPolicy.new(sender, conversation).send?
      return failure(:validation_failed) if body.to_s.strip.empty?
      return failure(:validation_failed) if body.to_s.length > Settings.fetch(:max_message_length)
      return failure(:validation_failed) if invalid_nonce?(client_nonce)
      return failure(:validation_failed) unless future?(scheduled_at)
      return failure(:validation_failed) if invalid_rule?(recurrence_rule)

      existing = existing_by_nonce(client_nonce)
      return success(existing) if existing

      persist(conversation, sender, body, scheduled_at, client_nonce, reply_to_message_id, recurrence_rule)
    end

    private

    def persist(conversation, sender, body, scheduled_at, client_nonce, reply_to_message_id, recurrence_rule)
      at = parse_time(scheduled_at)
      parsed = Recurrence::Rrule.parse(recurrence_rule)
      success(
        ScheduledMessage.create!(
          conversation: conversation,
          sender_account: sender,
          body: body.to_s.strip,
          scheduled_at: at,
          client_nonce: client_nonce.presence,
          reply_to_message_id: reply_to_message_id,
          recurrence_rule: recurrence_rule.presence,
          next_run_at: parsed.is_a?(Recurrence::Rrule::Parsed) ? at : nil,
          ends_at: parsed.is_a?(Recurrence::Rrule::Parsed) ? parsed.until_at : nil
        )
      )
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    rescue ActiveRecord::RecordNotUnique
      success(ScheduledMessage.find_by!(client_nonce: client_nonce))
    end

    def existing_by_nonce(client_nonce)
      return if client_nonce.blank?

      ScheduledMessage.find_by(client_nonce: client_nonce)
    end

    def invalid_nonce?(client_nonce)
      return false if client_nonce.blank?

      client_nonce.to_s.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i).!
    end

    def invalid_rule?(recurrence_rule)
      Recurrence::Rrule.parse(recurrence_rule) == :invalid
    end

    def future?(scheduled_at)
      parse_time(scheduled_at)&.future?
    end

    def parse_time(scheduled_at)
      scheduled_at.is_a?(String) ? Time.zone.parse(scheduled_at) : scheduled_at
    end
  end
end
