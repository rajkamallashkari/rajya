module Attachments
  class Transcribe < ApplicationOperation
    def call(attachment_id: nil, attachment: nil)
      record = attachment || Attachment.find_by(id: attachment_id)
      return success(record) if record.nil?
      return success(record) unless record.voice?
      unless FeatureFlag.enabled?(:voice_transcription, account: record.message&.sender_account)
        clear_pending!(record)
        return success(record)
      end

      transcribe!(record)
      success(record)
    end

    def fail_record!(record)
      return if record.nil?

      record.update!(transcript_status: "failed", transcript: nil)
      publish(record)
    end

    private

    def transcribe!(record)
      unless record.file.attached?
        fail_record!(record)
        return
      end

      record.update!(transcript_status: "pending")
      outcome = run(record)
      apply(record, outcome)
      publish(record)
    end

    def run(record)
      record.file.blob.open do |io|
        Ai::Runner.transcribe(
          io: io,
          filename: record.file.filename.to_s,
          content_type: record.content_type,
          account: record.message&.sender_account,
          conversation: record.message&.conversation
        )
      end
    end

    def apply(record, outcome)
      if outcome.status == "success"
        record.update!(
          transcript: outcome.transcript.text,
          transcript_language: outcome.transcript.language,
          transcript_status: "ready"
        )
      else
        record.update!(transcript_status: "failed", transcript: nil)
      end
    end

    def clear_pending!(record)
      return unless record.transcript_status == "pending"

      record.update!(transcript_status: nil)
      publish(record)
    end

    def publish(record)
      message = record.message
      return if message.nil?

      Realtime.publish(
        message.conversation, :attachment_processed,
        "message_id" => message.id, "attachment_id" => record.id
      )
    end
  end
end
