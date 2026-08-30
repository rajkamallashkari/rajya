module ScheduledMessages
  class Update < ApplicationOperation
    def call(scheduled_message:, actor:, body: nil, scheduled_at: nil)
      return failure(:forbidden) unless scheduled_message.sender_account_id == actor.id
      return failure(:forbidden) unless ConversationPolicy.new(actor, scheduled_message.conversation).send?
      return failure(:validation_failed) if body.is_a?(String) && body.strip.empty?
      return failure(:validation_failed) if body.to_s.length > Settings.fetch(:max_message_length)
      return failure(:validation_failed) if scheduled_at.present? && !future?(scheduled_at)

      scheduled_message.body = body.strip if body.is_a?(String)
      scheduled_message.scheduled_at = parse_time(scheduled_at) if scheduled_at.present?
      scheduled_message.save!
      success(scheduled_message)
    rescue ActiveRecord::RecordInvalid
      failure(:validation_failed)
    end

    private

    def future?(scheduled_at)
      parse_time(scheduled_at)&.future?
    end

    def parse_time(scheduled_at)
      scheduled_at.is_a?(String) ? Time.zone.parse(scheduled_at) : scheduled_at
    end
  end
end
