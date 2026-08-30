module Messages
  class Send < ApplicationOperation
    def call(conversation:, sender:, body: nil, client_nonce: nil, reply_to_message_id: nil,
             attachment_signed_ids: [], voice_duration_ms: nil, voice_waveform: nil,
             poll: nil, location: nil, contacts: nil)
      @conversation = conversation
      @sender = sender
      @body = body.to_s
      @client_nonce = client_nonce
      @reply_to_message_id = reply_to_message_id
      @signed_ids = Array(attachment_signed_ids).compact_blank
      @voice_duration_ms = voice_duration_ms
      @voice_waveform = voice_waveform
      @poll = poll
      @location = location
      @contacts = contacts

      return failure(:forbidden) unless ConversationPolicy.new(sender, conversation).send?

      error = validate
      return error if error

      existing = existing_by_nonce
      return success(existing) if existing

      persist_and_finish
    end

    private

    def persist_and_finish
      message = persist
      return failure(:validation_failed) if message.nil?

      mark_sender_read!(message)
      touch_sidebar!(message)
      publish!(message)
      success(message)
    end

    def validate
      return failure(:validation_failed) if blank_content?
      return failure(:validation_failed) if @body.length > Settings.fetch(:max_message_length)
      return failure(:validation_failed) if invalid_nonce?
      return failure(:validation_failed) if voice_too_long?
      return failure(:not_found) if reply_missing?
      return failure(:validation_failed) if reply_cross_conversation?
      child_error = Children.validate(poll: @poll, location: @location, contacts: @contacts)
      return failure(child_error) if child_error

      nil
    end

    def blank_content?
      @body.strip.empty? && @signed_ids.empty? &&
        !Children.present?(poll: @poll, location: @location, contacts: @contacts)
    end

    def invalid_nonce?
      return false if @client_nonce.blank?

      @client_nonce.to_s.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i).!
    end

    def voice_too_long?
      return false if @voice_duration_ms.blank?

      @voice_duration_ms.to_i > Settings.fetch(:voice_note_max_seconds).seconds.in_milliseconds
    end

    def reply_missing?
      @reply_to_message_id.present? && parent.nil?
    end

    def reply_cross_conversation?
      parent.present? && parent.conversation_id != @conversation.id
    end

    def parent
      return @parent if defined?(@parent)

      @parent = @reply_to_message_id.present? ? Message.find_by(id: @reply_to_message_id) : nil
    end

    def existing_by_nonce
      return if parsed_nonce.nil?

      Message.find_by(conversation_id: @conversation.id, client_nonce: parsed_nonce)
    end

    def parsed_nonce
      return if @client_nonce.blank? || invalid_nonce?

      @client_nonce.to_s
    end

    def persist
      Message.transaction { insert_row! }
    rescue ActiveRecord::RecordNotUnique => e
      raise unless nonce_conflict?(e)

      Message.find_by!(conversation_id: @conversation.id, client_nonce: parsed_nonce)
    end

    def insert_row!
      position, revision = Conversations::Sequencer.next_send!(@conversation.id)
      message = Message.create!(
        conversation: @conversation,
        sender_account: @sender,
        body: @body.strip.presence,
        kind: infer_kind,
        client_nonce: parsed_nonce,
        reply_to_message: parent,
        position: position,
        revision: revision,
        sender_snapshot: Snapshot.for(@sender)
      )
      Blobs.attach!(
        message,
        signed_ids: @signed_ids,
        voice: voice?,
        voice_duration_ms: @voice_duration_ms.to_i,
        voice_waveform: @voice_waveform
      )
      Children.attach!(message, poll: @poll, location: @location, contacts: @contacts)
      raise ActiveRecord::Rollback if empty_after_attach?(message)

      message
    end

    def empty_after_attach?(message)
      message.body.blank? && message.attachment_count.zero? &&
        message.poll.nil? && message.message_location.nil? && message.message_contacts.empty?
    end

    def nonce_conflict?(error)
      parsed_nonce.present? && error.message.include?("idx_messages_client_nonce_unique")
    end

    def infer_kind
      return "text" if @signed_ids.empty?
      return "voice" if voice?

      first = ActiveStorage::Blob.find_signed(@signed_ids.first)
      first ? Attachment.kind_for(first.content_type) : "file"
    end

    def voice?
      @voice_duration_ms.present?
    end

    def mark_sender_read!(message)
      membership = @conversation.conversation_memberships.active.find_by(account_id: @sender.id)
      return if membership.nil?

      position = message.position
      membership.update_columns(
        unread_count: 0,
        last_read_position: [ membership.last_read_position, position ].max,
        last_seen_position: [ membership.last_seen_position, position ].max,
        last_delivered_position: [ membership.last_delivered_position, position ].max
      )
    end

    def touch_sidebar!(message)
      @conversation.update_columns(last_message_id: message.id, last_activity_at: message.created_at)
    end

    def publish!(message)
      Realtime.publish("conversation:#{@conversation.id}", :message_created, "message_id" => message.id)
    end
  end
end
