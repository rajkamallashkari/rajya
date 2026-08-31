module Calls
  # One system message per call, edited in place as status changes (BR-67).
  class History < ApplicationOperation
    def call(call:, busy: false)
      @call = call
      @busy = busy
      return failure(:not_found) if @call.nil?

      message = find_message
      saved = if message.nil?
                persist_new!
      else
                persist_edit!(message)
      end
      success(saved)
    end

    private

    def find_message
      Message.where(conversation_id: @call.conversation_id, kind: "system")
             # rubocop:disable Rajya/NoUserFacingStrings -- JSONB predicate, not UI copy
             .where("metadata->>'call_id' = ?", @call.id.to_s)
             # rubocop:enable Rajya/NoUserFacingStrings
             .first
    end

    def persist_new!
      Message.transaction do
        position, revision = Conversations::Sequencer.next_send!(@call.conversation_id)
        message = Message.create!(
          conversation: @call.conversation,
          sender_account: nil,
          kind: "system",
          system_event: event_name,
          body: body_copy,
          metadata: metadata,
          position: position,
          revision: revision
        )
        finish!(message, :message_created)
        message
      end
    rescue ActiveRecord::RecordNotUnique
      persist_edit!(find_message)
    end

    def persist_edit!(message)
      Message.transaction do
        revision = Conversations::Sequencer.next_revision!(@call.conversation_id)
        message.update!(
          system_event: event_name,
          body: body_copy,
          metadata: metadata,
          revision: revision,
          edited_at: Time.current
        )
        finish!(message, :message_edited)
        message
      end
    end

    def finish!(message, event)
      @call.conversation.update_columns(last_message_id: message.id, last_activity_at: message.created_at)
      Realtime.publish(@call.conversation, event, "message_id" => message.id)
    end

    def event_name
      return "call_missed" if %w[missed declined].include?(@call.status)
      return "call_ended" if @call.status == "ended"

      "call_started"
    end

    def body_copy
      return Catalog.t("system_events.call_busy") if @busy && %w[missed declined].include?(@call.status)
      return Catalog.t("system_events.call_started") if @call.status == "ringing"
      return Catalog.t("system_events.call_active") if @call.status == "active"
      return missed_copy if %w[missed declined].include?(@call.status)

      ended_copy
    end

    def missed_copy
      Catalog.t("system_events.call_missed_#{@call.kind}")
    end

    def ended_copy
      kind = Catalog.t("system_events.call_ended_#{@call.kind}")
      duration = @call.duration_seconds.to_i
      return kind unless duration.positive?

      # rubocop:disable Rajya/NoMagicNumbers -- SI seconds per minute for BR-68 duration copy
      minutes = duration / 60
      seconds = (duration % 60).to_s.rjust(2, "0")
      # rubocop:enable Rajya/NoMagicNumbers
      Catalog.t("system_events.call_ended_duration", kind: kind, minutes: minutes, seconds: seconds)
    end

    def metadata
      {
        "call_id" => @call.id,
        "kind" => @call.kind,
        "status" => @call.status,
        "duration_seconds" => @call.duration_seconds,
        "initiated_at" => @call.created_at.iso8601,
        "answered_at" => @call.started_at&.iso8601,
        "busy" => @busy || false
      }
    end
  end
end
