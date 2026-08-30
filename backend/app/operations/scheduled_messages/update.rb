module ScheduledMessages
  class Update < ApplicationOperation
    def call(scheduled_message:, actor:, body: nil, scheduled_at: nil, recurrence_rule: nil)
      return failure(:forbidden) unless scheduled_message.sender_account_id == actor.id
      return failure(:forbidden) unless ConversationPolicy.new(actor, scheduled_message.conversation).send?
      return failure(:validation_failed) if body.is_a?(String) && body.strip.empty?
      return failure(:validation_failed) if body.to_s.length > Settings.fetch(:max_message_length)
      return failure(:validation_failed) if scheduled_at.present? && !future?(scheduled_at)
      return failure(:validation_failed) if recurrence_given?(recurrence_rule) && invalid_rule?(recurrence_rule)

      apply!(scheduled_message, body, scheduled_at, recurrence_rule)
      scheduled_message.save!
      success(scheduled_message)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    private

    def apply!(row, body, scheduled_at, recurrence_rule)
      row.body = body.strip if body.is_a?(String)
      row.scheduled_at = parse_time(scheduled_at) if scheduled_at.present?
      return unless recurrence_given?(recurrence_rule)

      row.recurrence_rule = recurrence_rule.presence
      parsed = Recurrence::Rrule.parse(row.recurrence_rule)
      row.ends_at = parsed.is_a?(Recurrence::Rrule::Parsed) ? parsed.until_at : nil
      row.next_run_at = parsed.is_a?(Recurrence::Rrule::Parsed) ? row.scheduled_at : nil
    end

    def recurrence_given?(recurrence_rule)
      !recurrence_rule.nil?
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
