module Attachments
  class RetryTranscript < ApplicationOperation
    def call(attachment:)
      return failure(:not_found) unless FeatureFlag.enabled?(:voice_transcription, account: attachment.message&.sender_account)
      return failure(:validation_failed) unless attachment.voice?
      return failure(:validation_failed) unless attachment.visible_transcript_status.in?([ nil, "failed" ])
      return failure(:upstream_failed) unless Ai::ModelRegistry.available_for?(:transcribe)

      attachment.update!(transcript_status: "pending", transcript: nil)
      TranscribeJob.perform_later(attachment.id)
      success(attachment)
    end
  end
end
